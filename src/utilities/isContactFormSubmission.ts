const CONTACT_FORM_TITLE = 'contact form'

export function isContactFormTitle(title?: string | null): boolean {
  return title?.trim().toLowerCase() === CONTACT_FORM_TITLE
}

/**
 * Contact section submissions set syncToOptimaCrm on the client.
 * Title match is a fallback when that flag is missing.
 */
export function shouldSyncSubmissionToOptimaCrm(data: {
  syncToOptimaCrm?: boolean | null
  form?: { title?: string | null } | number | null
}): boolean {
  if (data.syncToOptimaCrm === true) return true

  if (typeof data.form === 'object' && data.form !== null && 'title' in data.form) {
    return isContactFormTitle((data.form as { title?: string | null }).title)
  }

  return false
}
