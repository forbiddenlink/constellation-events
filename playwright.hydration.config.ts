import { defineConfig } from "@playwright/test";

// Dedicated config for the hydration-mismatch regression test.
// Must run against a PRODUCTION build (next build && next start): dev mode
// disables React's strict double-render / hydration warnings that this
// test exists to catch.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "hydration.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    timezoneId: "Pacific/Auckland",
    locale: "de-DE"
  },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 180 * 1000
  }
});
