import { getPayloadPopulateFn } from '@payloadcms/richtext-lexical'
import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Payload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

function toAbsoluteMediaUrls(html: string, serverURL: string): string {
  const base = serverURL.replace(/\/$/, '')
  return html.replace(/src="(\/[^"]+)"/g, `src="${base}$1"`)
}

export async function lexicalToEmailHtml(
  payload: Payload,
  data: SerializedEditorState | null | undefined,
): Promise<string> {
  if (!data?.root) return ''

  const populate = await getPayloadPopulateFn({
    currentDepth: 0,
    depth: payload.config.defaultDepth,
    overrideAccess: true,
    payload,
  })

  const html = await convertLexicalToHTMLAsync({
    data,
    populate,
  })

  return toAbsoluteMediaUrls(html, getServerSideURL())
}
