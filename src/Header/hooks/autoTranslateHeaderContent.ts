import type { GlobalAfterChangeHook } from 'payload'

import { HEADER_FIELD_REGISTRY } from '@/utilities/autoTranslate/headerFieldRegistry'
import { createGlobalAutoTranslateHook } from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslateHeaderContent: GlobalAfterChangeHook = createGlobalAutoTranslateHook({
  slug: 'header',
  registry: HEADER_FIELD_REGISTRY,
})
