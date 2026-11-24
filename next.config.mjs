/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
]

const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST?.trim()
if (mediaHost) {
  remotePatterns.push({
    protocol: 'https',
    hostname: mediaHost,
    pathname: '/**',
  })
}

const nextConfig = {
  images: {
    remotePatterns,
  },
}

export default nextConfig
