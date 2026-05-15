import type { Metadata } from "next";
import { Noto_Sans_Thai, IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ระบบปกครอง - โรงเรียนบางพลีราษฎร์บำรุง",
  description: "ระบบบันทึกข้อมูลด้านความประพฤติของนักเรียน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${ibmPlexMono.variable} ${ibmPlexSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <NextTopLoader color="#6366f1" showSpinner={false} />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
