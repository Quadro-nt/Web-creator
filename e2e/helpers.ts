import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'artists')

export function getEditorUrl(token: string): string {
  return `http://localhost:3000/editor/${token}`
}

export function getPublicSiteUrl(slug: string): string {
  return `http://${slug}.localhost:3000`
}

export function getArtworkUrl(slug: string, workSlug: string): string {
  return `http://${slug}.localhost:3000/obras/${workSlug}`
}

const CONFIG_FILES = ['config.published.json', 'config.draft.json'] as const

export function backupArtistConfig(slug: string): void {
  const artistDir = path.join(DATA_DIR, slug)
  for (const file of CONFIG_FILES) {
    const srcPath = path.join(artistDir, file)
    const bakPath = path.join(artistDir, `${file}.bak`)
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, bakPath)
    } else if (fs.existsSync(bakPath)) {
      fs.unlinkSync(bakPath)
    }
  }
}

export function resetArtistConfig(slug: string): void {
  const artistDir = path.join(DATA_DIR, slug)
  for (const file of CONFIG_FILES) {
    const bakPath = path.join(artistDir, `${file}.bak`)
    const dstPath = path.join(artistDir, file)
    if (fs.existsSync(bakPath)) {
      fs.copyFileSync(bakPath, dstPath)
      fs.unlinkSync(bakPath)
    }
  }
}
