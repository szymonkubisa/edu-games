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
    // Must match the address `npm run preview` binds. Leaving the bind implicit
    // cost a CI cycle: vite preview defaults to `localhost`, which on a GitHub
    // runner (where /etc/hosts carries `::1 localhost`) can bind IPv6 only,
    // while Playwright polls 127.0.0.1 and waits out the full timeout.
    url: 'http://127.0.0.1:4599',
    // Always start our own server. `!process.env.CI` is the usual default, but
    // it meant local runs reused whatever was already on the port and never
    // exercised the command CI depends on — which is how the bug above shipped.
    reuseExistingServer: false,
    // Surface the server's own output; the failure above showed only
    // Playwright's timeout, with nothing about why the server was unreachable.
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60_000
  }
});
