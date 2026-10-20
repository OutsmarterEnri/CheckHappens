import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 1100 },
  },
  webServer: [
    {
      command:
        "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    },
    {
      command: "node scripts/serve.mjs",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    },
  ],
});
