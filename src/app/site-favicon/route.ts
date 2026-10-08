import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getFaviconSource } from '@/components/Logo/getLogoSources'
import { toRelativeMediaPath } from '@/utilities/getMediaUrl'

export const dynamic = 'force-dynamic'

function redirectToFavicon(path: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: path },
  })
}

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  try {
    const logo = await payload.findGlobal({
      slug: 'logo',
      depth: 1,
    })

    const favicon = toRelativeMediaPath(getFaviconSource(logo))
    return redirectToFavicon(favicon)
  } catch {
    return redirectToFavicon('/favicon.ico')
  }
}
