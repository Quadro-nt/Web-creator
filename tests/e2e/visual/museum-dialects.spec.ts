import { test, expect, Page } from '@playwright/test'

const ARTISTS = ['luna-vega', 'marco-torres', 'sofia-rios'] as const

async function waitForImages(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    const images = Array.from(document.images)
    await Promise.all(
      images.map((img) =>
        img.complete
          ? undefined
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            })
      )
    )
  })
}

for (const slug of ARTISTS) {
  test(`museum dialect renders stable for ${slug}`, async ({ page }) => {
    await page.goto(`/sites/${slug}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await waitForImages(page)
    await expect(page).toHaveScreenshot(`${slug}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })
}
