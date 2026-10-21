import { defineConfig } from "vitest/config";
import { getBuildInfo } from "./scripts/build-info.mjs";
export default defineConfig({
  base: "./",
  define: { __APP_BUILD__: JSON.stringify(getBuildInfo()) },
  server: { watch: { usePolling: true, interval: 250 } },
  test: { include: ["tests/**/*.test.ts"], maxWorkers: 2 },
});
