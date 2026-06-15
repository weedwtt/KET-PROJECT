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

export async function htmlToPdf(html: string, opts?: { cropSignatures?: boolean }): Promise<Buffer> {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    // Fonts, logo, and signature images are all inlined as data URIs.
    // "load" waits for those images, and fonts.ready guards against FOUT.
    await page.setContent(html, { waitUntil: "load" })
    await page.evaluateHandle("document.fonts.ready")

    // Normalize signatures: crop each <img.sig-crop> to its ink bounding box so
    // signatures display at a consistent size regardless of how big/small the
    // person signed within the canvas (e.g. iPad-zoomed pads draw tiny ink in a
    // large transparent canvas). Runs in-page on data-URI images (same-origin,
    // no canvas taint). Must run BEFORE the zoom step since cropping changes
    // image heights and thus the document's total height.
    if (opts?.cropSignatures) {
      await page.evaluate(`(function () {
        var imgs = Array.prototype.slice.call(document.querySelectorAll("img.sig-crop"));
        return Promise.all(imgs.map(function (img) {
          return new Promise(function (resolve) {
            try {
              var w = img.naturalWidth, h = img.naturalHeight;
              if (!w || !h) return resolve();
              var c = document.createElement("canvas");
              c.width = w; c.height = h;
              var ctx = c.getContext("2d");
              if (!ctx) return resolve();
              ctx.drawImage(img, 0, 0);
              var data = ctx.getImageData(0, 0, w, h).data;
              var minX = w, minY = h, maxX = -1, maxY = -1;
              for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                  if (data[(y * w + x) * 4 + 3] > 10) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }
              if (maxX < minX || maxY < minY) return resolve();
              var pad = 6;
              minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
              maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
              var cw = maxX - minX + 1, ch = maxY - minY + 1;
              var out = document.createElement("canvas");
              out.width = cw; out.height = ch;
              var octx = out.getContext("2d");
              if (!octx) return resolve();
              octx.drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);
              img.src = out.toDataURL("image/png");
              if (img.decode) { img.decode().then(resolve, resolve); } else { resolve(); }
            } catch (e) { resolve(); }
          });
        }));
      })()`)
    }

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
