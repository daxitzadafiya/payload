import type { GlobalAfterChangeHook } from 'payload'

import { LOCALIZATION_FIELD_REGISTRY } from '@/utilities/autoTranslate/localizationFieldRegistry'
import { createGlobalAutoTranslateHook } from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslateLocalizationContent: GlobalAfterChangeHook =
  createGlobalAutoTranslateHook({
    slug: 'localization',
    registry: LOCALIZATION_FIELD_REGISTRY,
  })
