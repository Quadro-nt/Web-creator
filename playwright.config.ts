import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    navigationTimeout: 60000,
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_WHATSAPP_NUMBER: '51999000000',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
    },
  },
})
