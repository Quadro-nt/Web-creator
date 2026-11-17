import { test, expect } from '@playwright/test'
import { getPublicSiteUrl } from './helpers'

test.describe('Public site', () => {
  test('Sitio de luna-vega carga correctamente', async ({ page }) => {
    await page.goto(getPublicSiteUrl('luna-vega'))
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Luna Vega')
    const artworkImages = page.locator('img')
    await expect(artworkImages.first()).toBeVisible()
  })

  test('Sitio de marco-torres carga', async ({ page }) => {
    const response = await page.goto(getPublicSiteUrl('marco-torres'))
    expect(response?.status()).not.toBe(500)
    await expect(page).not.toHaveTitle(/500|error/i)
  })

  test('Sitio de sofia-rios carga', async ({ page }) => {
    const response = await page.goto(getPublicSiteUrl('sofia-rios'))
    expect(response?.status()).not.toBe(500)
    await expect(page).not.toHaveTitle(/500|error/i)
  })
})
