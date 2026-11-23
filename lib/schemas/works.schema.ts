import { z } from 'zod'
import { mediaUrlSchema } from './site-config.schema'

export const ArtworkSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1).max(120),
  year: z.number().int().min(1900).max(2100),
  medium: z.string().max(80),
  dimensions: z.string().max(60),
  price: z.number().positive().optional(),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  sold: z.boolean().default(false),
  images: z.array(mediaUrlSchema).min(1),
  description: z.string().max(600).optional(),
  tags: z.array(z.string()).default([]),
})

export type Artwork = z.infer<typeof ArtworkSchema>

export const WorksFileSchema = z.object({
  artistSlug: z.string(),
  works: z.array(ArtworkSchema),
})

export type WorksFile = z.infer<typeof WorksFileSchema>
