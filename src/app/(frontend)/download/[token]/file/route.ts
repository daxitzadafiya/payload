import { NextResponse } from 'next/server'

import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { resolveDocumentDownloadLink } from '@/utilities/documentDownloadToken'
import {
  documentDownloadFilename,
  fetchAllowedDocument,
} from '@/utilities/proxyDocumentDownload'

type Args = {
  params: Promise<{
    token: string
  }>
}

function unavailable(): NextResponse {
  return new NextResponse(
    'This document could not be downloaded. Please request a new link from the property page.',
    {
      status: 502,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  )
}

export async function GET(request: Request, { params }: Args): Promise<NextResponse> {
  const { token } = await params
  const grant = await resolveDocumentDownloadLink(token)

  if (grant.status !== 'valid') {
    return NextResponse.redirect(new URL(`/download/${encodeURIComponent(token)}`, request.url))
  }

  try {
    const settings = await getOptimaCrmSettings()
    const upstream = await fetchAllowedDocument(grant.url, settings)
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

    // CRM/CDN error pages often come back as HTML with a non-2xx or soft 200.
    if (!upstream.ok || contentType.toLowerCase().includes('text/html')) {
      console.error('[document-download] upstream rejected', {
        status: upstream.status,
        contentType,
        url: grant.url,
      })
      return unavailable()
    }

    const filename = documentDownloadFilename(grant.filename, contentType).replaceAll('"', '')
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType.split(';')[0]?.trim() || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  } catch (error) {
    console.error('[document-download] proxy failed', {
      url: grant.url,
      error: error instanceof Error ? error.message : error,
    })
    return unavailable()
  }
}
