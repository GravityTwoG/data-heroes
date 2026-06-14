import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file present (e.g., running inside Docker with injected env vars)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
