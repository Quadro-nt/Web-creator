import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/app/onboarding/OnboardingForm'
import { getSessionUserFromCookies } from '@/lib/auth/session'
import {
  getArtistByUserId,
  type TemplateChoice,
} from '@/lib/onboarding/artist-onboarding'

export const dynamic = 'force-dynamic'

const VALID_TEMPLATES = new Set<TemplateChoice>([
  'minimal-gallery',
  'editorial',
  'immersive',
])

function parseTemplateParam(
  value: string | string[] | undefined
): TemplateChoice | undefined {
  const raw = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined
  if (!raw || !VALID_TEMPLATES.has(raw as TemplateChoice)) {
    return undefined
  }
  return raw as TemplateChoice
}

/** Server page for artist onboarding, guarding against unauthenticated or already-onboarded users. */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { template?: string | string[] }
}) {
  const user = await getSessionUserFromCookies(cookies())
  if (!user) {
    redirect('/login')
  }

  const existingSite = await getArtistByUserId(user.id)
  if (existingSite) {
    redirect('/studio')
  }

  const initialTemplate = parseTemplateParam(searchParams?.template)

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-10 text-[#161616] sm:py-14">
      <OnboardingForm userEmail={user.email} initialTemplate={initialTemplate} />
    </main>
  )
}
