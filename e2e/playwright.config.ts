import {defineConfig, devices} from '@playwright/test';
import {webPort, reportDirectory} from './runner/settings.ts';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: {timeout: 10_000},
  outputDir: './test-results',
  reporter: [
    ['./runner/safe-reporter.ts'],
    ['line'],
    ['json', {outputFile: reportDirectory()+'/results.json'}],
    ['junit', {outputFile: reportDirectory()+'/junit.xml'}],
    ['html', {outputFolder: reportDirectory()+'/html', open: 'never'}],
  ],
  use: {
    baseURL: `http://uc.localhost:${webPort}`,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'off', // Fixtures record only after login and scrub credentials before attachment.
    screenshot: 'off', // Fixture masks credentials on failure before attaching.
    video: 'off',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    viewport: {width: 1440, height: 900},
    serviceWorkers: 'block',
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'firefox', grep: /@smoke|E2E-A11Y-007/, use: {...devices['Desktop Firefox']}},
    {name: 'webkit', grep: /@smoke|E2E-A11Y-007/, use: {...devices['Desktop Safari']}},
    {name: 'mobile', grep: /E2E-A11Y-|E2E-PUBLIC-/, use: {...devices['Desktop Chrome'], viewport: {width: 375, height: 812}}},
  ],
});
