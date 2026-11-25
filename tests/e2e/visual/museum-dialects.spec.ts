import { test, expect, Page } from '@playwright/test'

const ARTISTS = ['luna-vega', 'marco-torres', 'sofia-rios'] as const

async function waitForImages(page: Page, perImageTimeoutMs = 10000) {
  await page.evaluate(async (timeoutMs) => {
    const images = Array.from(document.images)
    await Promise.all(
      images.map((img) =>
        img.complete
          ? undefined
          : new Promise<void>((resolve) => {
              const done = () => resolve()
              img.addEventListener('load', done, { once: true })
              img.addEventListener('error', done, { once: true })
              setTimeout(done, timeoutMs)
            })
      )
    )
  }, perImageTimeoutMs)
}

for (const slug of ARTISTS) {
  test(`museum dialect renders stable for ${slug}`, async ({ page }) => {
    await page.goto(`/sites/${slug}`, { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await waitForImages(page)
    await expect(page).toHaveScreenshot(`${slug}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })
}
