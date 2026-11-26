/** Slugs that cannot be used as page slugs because they collide with static routes. */
export const RESERVED_PAGE_SLUGS: ReadonlySet<string> = new Set([
  'obras',
])
