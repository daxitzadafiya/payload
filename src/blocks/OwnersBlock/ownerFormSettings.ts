import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'

/** Shared owner-form copy used by the homepage card and the sell/rent pages. */
export type OwnerFormSettings = {
  form: FormType
  enableResubmit?: boolean | null
  resubmitButtonLabel?: string | null
  submitLabelOverride?: string | null
  successTitle?: string | null
  successSubtitle?: string | null
  trustNote?: string | null
}
