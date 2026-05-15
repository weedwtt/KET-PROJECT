import type { Metadata } from "next"
import { Noto_Sans_Thai, IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import NextTopLoader from "nextjs-toploader"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { cn } from "@/lib/utils"

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "ระบบปกครอง — โรงเรียนบางพลีราษฎร์บำรุง",
  description: "ระบบบันทึกข้อมูลด้านความประพฤติของนักเรียน",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        notoSansThai.variable,
        ibmPlexMono.variable,
        ibmPlexSerif.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <NextTopLoader color="#3b82f6" showSpinner={false} height={2} />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
