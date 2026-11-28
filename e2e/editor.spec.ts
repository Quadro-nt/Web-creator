import { test, expect } from '@playwright/test'
import { backupArtistConfig, resetArtistConfig, getEditorUrl, getPublicSiteUrl } from './helpers'

const ARTIST_SLUG = 'luna-vega'
const TOKEN = 'token-luna-vega-dev'
const PUBLISHED_TITLE = 'Luna Vega — Arte'
const DRAFT_TITLE = 'Luna Vega — Arte y Diseño'

test.describe('Editor', () => {
  test.beforeAll(() => {
    backupArtistConfig(ARTIST_SLUG)
  })

  test.afterAll(() => {
    resetArtistConfig(ARTIST_SLUG)
  })

  test('Editor carga con la config de luna-vega', async ({ page }) => {
    await page.goto(getEditorUrl(TOKEN))
    await expect(page.locator('[data-testid="preview-frame"] h1')).toContainText('Luna Vega')
    await expect(page.getByRole('button', { name: 'Guardar borrador' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Publicar' })).toBeVisible()
  })

  test('Guardar borrador no afecta el sitio publico', async ({ page }) => {
    await page.goto(getEditorUrl(TOKEN))
    await page.getByRole('button', { name: 'Guardar borrador' }).click()
    await expect(page.getByRole('status')).toContainText('Guardado', { timeout: 10000 })

    await page.goto(getPublicSiteUrl(ARTIST_SLUG))
    await expect(page.getByRole('heading', { level: 1 })).toContainText(PUBLISHED_TITLE)
  })

  test('Publicar actualiza el sitio publico', async ({ page }) => {
    await page.goto(getEditorUrl(TOKEN))
    await page.getByRole('button', { name: 'Publicar' }).click()
    await expect(page.getByRole('status')).toContainText('Publicado', { timeout: 10000 })

    await page.goto(getPublicSiteUrl(ARTIST_SLUG))
    await expect(page.getByRole('heading', { level: 1 })).toContainText(DRAFT_TITLE)
  })

  test('Editor con token invalido muestra acceso denegado', async ({ page }) => {
    await page.goto(getEditorUrl('token-invalido-xyz'))
    await expect(page.locator('[data-testid="editor-root"]')).not.toBeAttached()
    await expect(page.getByText(/acceso denegado/i)).toBeVisible()
  })
})
