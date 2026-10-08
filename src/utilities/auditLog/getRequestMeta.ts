import type { PayloadRequest } from 'payload'

function headerValue(req: PayloadRequest, name: string): string | undefined {
  try {
    const value = req.headers?.get?.(name)
    if (typeof value === 'string' && value.trim()) return value.trim()
  } catch {
    // ignore
  }
  return undefined
}

export function getRequestIp(req: PayloadRequest): string | undefined {
  const forwarded = headerValue(req, 'x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headerValue(req, 'x-real-ip')
}

export function getRequestUserAgent(req: PayloadRequest): string | undefined {
  return headerValue(req, 'user-agent')
}
