import type { GlobalAfterChangeHook } from 'payload'

import { FOOTER_FIELD_REGISTRY } from '@/utilities/autoTranslate/footerFieldRegistry'
import { createGlobalAutoTranslateHook } from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslateFooterContent: GlobalAfterChangeHook = createGlobalAutoTranslateHook({
  slug: 'footer',
  registry: FOOTER_FIELD_REGISTRY,
})
