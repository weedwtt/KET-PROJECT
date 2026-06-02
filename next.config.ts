import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // The Chromium binary ships as brotli (.br) files that are loaded by path at
  // runtime, not via import — so @vercel/nft can't trace them and they get left
  // out of the serverless bundle ("input directory .../bin does not exist").
  // Force-include the bin folder for the PDF routes. Route keys use picomatch,
  // so the dynamic segment is matched with `*` (not the literal `[id]`).
  outputFileTracingIncludes: {
    "/api/statements/*/export-pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/api/bonds/*/export-pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
