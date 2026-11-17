import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'artists')

export function getEditorUrl(token: string): string {
  return `/editor/${token}`
}

export function getPublicSiteUrl(slug: string): string {
  return `/_sites/${slug}`
}

export function backupArtistConfig(slug: string): void {
  const srcPath = path.join(DATA_DIR, slug, 'config.published.json')
  const bakPath = path.join(DATA_DIR, slug, 'config.published.json.bak')
  fs.copyFileSync(srcPath, bakPath)
}

export function resetArtistConfig(slug: string): void {
  const bakPath = path.join(DATA_DIR, slug, 'config.published.json.bak')
  const dstPath = path.join(DATA_DIR, slug, 'config.published.json')
  if (fs.existsSync(bakPath)) {
    fs.copyFileSync(bakPath, dstPath)
  }
}
