import type { GlobalAfterChangeHook } from 'payload'

import { PROPERTY_MAP_FIELD_REGISTRY } from '@/utilities/autoTranslate/propertyMapFieldRegistry'
import { createGlobalAutoTranslateHook } from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslatePropertyMapContent: GlobalAfterChangeHook =
  createGlobalAutoTranslateHook({
    slug: 'propertyMap',
    registry: PROPERTY_MAP_FIELD_REGISTRY,
  })
