import { defineConfig, devices } from '@playwright/test';

const CHROMIUM = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://127.0.0.1:4599', trace: 'on-first-retry' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: CHROMIUM } }
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], launchOptions: { executablePath: CHROMIUM } }
    }
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4599',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
