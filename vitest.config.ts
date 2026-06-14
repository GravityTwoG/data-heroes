import { defineConfig } from "vitest/config";
import path from "path";

const alias = { "@": path.resolve(__dirname, "src") };

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    sequence: { concurrent: true },
    testTimeout: 30_000,
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "e2e",
          include: ["tests/e2e/**/*.e2e.test.ts"],
          globalSetup: ["./tests/e2e/helpers/global-setup.ts"],
          maxWorkers: 1,
        },
      },
    ],
  },
});
