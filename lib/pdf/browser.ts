import type { Browser } from "puppeteer-core"

// On Vercel/serverless we run a stripped Chromium provided by @sparticuz/chromium
// through puppeteer-core. Locally we use the full `puppeteer` package, which ships
// its own Chrome download — so dev needs no extra setup.
const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === "production"

export async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default
    const puppeteer = await import("puppeteer-core")
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Browser
  }

  const puppeteer = await import("puppeteer")
  return puppeteer.launch({ headless: true }) as unknown as Browser
}

// A4 height at 96dpi = 297mm * 96/25.4 ≈ 1122.5px. Keep a little safety headroom.
const A4_CONTENT_PX = 1116
// Don't shrink below this — past it the form becomes hard to read.
const MIN_ZOOM = 0.6

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    // Fonts + logo are inlined as data URIs; signature images are remote URLs.
    // "load" waits for those images, and fonts.ready guards against FOUT.
    await page.setContent(html, { waitUntil: "load" })
    await page.evaluateHandle("document.fonts.ready")

    // Auto-fit to a single page: if the laid-out document is taller than one A4
    // page (e.g. a long "รายละเอียด" section), scale the whole document down with
    // CSS zoom until it fits. zoom scales layout uniformly, so the form keeps its
    // proportions and nothing is truncated. Passed as a string so bundler helpers
    // (esbuild's __name under tsx) aren't injected into the browser context.
    // zoom scales layout height linearly, so a single ratio is enough — measuring
    // again after applying zoom is unreliable (documentElement.scrollHeight does
    // not reflect a zoom set on <body>), which is why we compute it one-shot.
    await page.evaluate(`(function () {
      var maxH = ${A4_CONTENT_PX}, minZoom = ${MIN_ZOOM};
      var full = document.documentElement.scrollHeight;
      if (full <= maxH) return;
      document.body.style.zoom = String(Math.max(minZoom, (maxH / full) * 0.99));
    })()`)

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
