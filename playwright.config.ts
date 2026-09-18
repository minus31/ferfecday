import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node --import tsx scripts/e2e-server.ts",
      url: "http://127.0.0.1:8788/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run next:dev -- --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:8788",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-publishable-key",
        NEXT_PUBLIC_SERVICE_API_URL: "http://127.0.0.1:8788/api/service",
        NEXT_PUBLIC_LOCAL_TEST_ACCOUNT: "false",
      },
    },
  ],
});
