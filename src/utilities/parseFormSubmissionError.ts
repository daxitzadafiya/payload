/**
 * Extracts a user-facing message from Payload REST API error responses.
 */
export function parseFormSubmissionError(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'Something went wrong. Please try again.'
  }

  const record = body as Record<string, unknown>

  const errors = record.errors
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0]
    if (typeof first === 'string' && first.trim()) return first
    if (first && typeof first === 'object') {
      const err = first as Record<string, unknown>
      if (typeof err.message === 'string' && err.message.trim()) return err.message
      const data = err.data
      if (data && typeof data === 'object') {
        const dataMessage = (data as Record<string, unknown>).message
        if (typeof dataMessage === 'string' && dataMessage.trim()) return dataMessage
      }
    }
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message
  }

  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error
  }

  return 'Something went wrong. Please try again.'
}
