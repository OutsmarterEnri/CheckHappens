import { defineConfig } from "vitest/config";
export default defineConfig({
  base: "./",
  server: {watch: {usePolling:true,interval:250}},
  test: { include: ["tests/**/*.test.ts"] },
});
