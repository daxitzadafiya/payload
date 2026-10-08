import type { Endpoint, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { enqueueAutoTranslate } from './autoTranslateQueue'
import {
  forceTranslateField,
  getForceTranslateMeta,
  parseForceTranslateEntity,
} from './forceTranslateField'

async function readJsonBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  if (req.json && typeof req.json === 'function') {
    try {
      const body = await req.json()
      if (body && typeof body === 'object') return body as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (req.data && typeof req.data === 'object') return req.data as Record<string, unknown>
  return {}
}

export const forceTranslateMetaEndpoint: Endpoint = {
  path: '/force-translate/meta',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const meta = await getForceTranslateMeta(req.payload)
    return Response.json(meta)
  },
}

export const forceTranslateEndpoint: Endpoint = {
  path: '/force-translate',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const body = await readJsonBody(req)
    const path = typeof body.path === 'string' ? body.path : ''
    const target = typeof body.target === 'string' ? body.target : ''

    if (!path) throw new APIError('Field path is required', 400)
    if (!target) throw new APIError('Target language is required', 400)

    let entity
    try {
      entity = parseForceTranslateEntity(body)
    } catch (error) {
      throw new APIError(error instanceof Error ? error.message : 'Invalid request', 400)
    }

    try {
      const result = await enqueueAutoTranslate(() =>
        forceTranslateField({
          payload: req.payload,
          entity,
          path,
          target,
        }),
      )

      if (result.succeeded.length === 0) {
        const message = result.failed[0]?.error || 'Translation failed'
        return Response.json({ error: message, ...result }, { status: 502 })
      }

      return Response.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Translation failed'
      throw new APIError(message, 400)
    }
  },
}
