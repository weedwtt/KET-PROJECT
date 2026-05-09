import { expand } from "dotenv-expand";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (local overrides), then fall back to .env
expand(config({ path: ".env.local", override: false }));
expand(config({ path: ".env", override: false }));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
