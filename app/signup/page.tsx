import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthFormCard } from '@/components/auth/AuthFormCard'
import { getSessionUserFromCookies } from '@/lib/auth/session'
import { getArtistByUserId } from '@/lib/onboarding/artist-onboarding'

export const dynamic = 'force-dynamic'

function pickQueryParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

/** Server page for artist registration, redirecting authenticated users to studio or onboarding. */
export default async function SignupPage({
  searchParams,
}: {
  searchParams?: { template?: string | string[]; error?: string | string[] }
}) {
  const user = await getSessionUserFromCookies(cookies())
  if (user) {
    const artist = await getArtistByUserId(user.id)
    redirect(artist ? '/studio' : '/onboarding')
  }

  const initialTemplate = pickQueryParam(searchParams?.template)
  const initialError = pickQueryParam(searchParams?.error)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4 py-12 text-[#161616]">
      <AuthFormCard
        mode="signup"
        initialTemplate={initialTemplate}
        initialError={initialError}
      />
    </main>
  )
}
