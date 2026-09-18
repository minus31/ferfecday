import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests-local-account",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3200",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run next:dev -- --hostname 127.0.0.1 --port 3200",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_LOCAL_TEST_ACCOUNT: "true",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_SERVICE_API_URL: "http://127.0.0.1:3999/should-not-be-called",
    },
  },
});
