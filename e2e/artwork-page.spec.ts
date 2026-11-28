import { test, expect } from '@playwright/test'
import { getArtworkUrl } from './helpers'

test.describe('Artwork page', () => {
  test('Pagina de obra muestra la ficha tecnica', async ({ page }) => {
    await page.goto(getArtworkUrl('luna-vega', 'formas-01'))
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Amanecer en el patio')
    await expect(page.getByText('Técnica')).toBeVisible()
    await expect(page.getByText('óleo sobre lienzo')).toBeVisible()
  })

  test('Boton de WhatsApp en obra no vendida', async ({ page }) => {
    await page.goto(getArtworkUrl('luna-vega', 'formas-01'))
    const waLink = page.locator('a[href*="wa.me"]')
    await expect(waLink).toBeVisible()
    const href = await waLink.getAttribute('href')
    expect(href).toContain('wa.me')
  })

  test('Obra vendida no tiene boton de WhatsApp', async ({ page }) => {
    await page.goto(getArtworkUrl('luna-vega', 'formas-07'))
    await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0)
  })
})
