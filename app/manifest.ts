import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo'

/**
 * Emitted as a static /manifest.webmanifest. Referenced from the root layout's
 * `metadata.manifest`, which is what makes the site installable and gives
 * Lighthouse's PWA/SEO passes the name, colours and icons they look for.
 */
// `output: 'export'` has no server to run this per request, so it must be
// declared static — Next then writes the file once at build time.
export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — AI Video Generator`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#EAEEF9',
    theme_color: '#7C5CFF',
    lang: 'en',
    categories: ['productivity', 'multimedia', 'video'],
    icons: [
      { src: '/brand/mark-64.png', sizes: '64x64', type: 'image/png' },
      { src: '/brand/mark-180.png', sizes: '180x180', type: 'image/png' },
      {
        src: '/brand/mark-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/mark-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
