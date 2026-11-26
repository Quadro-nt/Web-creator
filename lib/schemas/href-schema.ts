import { z } from 'zod'

const DANGEROUS_SCHEME_RE = /^(?:javascript|data|vbscript):/i
const INTERNAL_RE = /^\/[a-z0-9-]*$/
const EXTERNAL_RE = /^(?:https?|mailto|tel):\S+/
const ANCHOR_RE = /^#[a-zA-Z0-9-_]+$/

/** True when value is a safe href (internal path, external URL, mailto, tel, or anchor). */
export function validateHref(value: string): boolean {
  if (typeof value !== 'string' || value === '') return false
  if (DANGEROUS_SCHEME_RE.test(value)) return false
  return INTERNAL_RE.test(value) || EXTERNAL_RE.test(value) || ANCHOR_RE.test(value)
}

export const hrefSchema = z.string().refine(validateHref, 'Link inválido')
