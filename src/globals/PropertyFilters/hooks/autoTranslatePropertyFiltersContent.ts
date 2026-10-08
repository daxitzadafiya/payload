import type { GlobalAfterChangeHook } from 'payload'

import { PROPERTY_FILTERS_FIELD_REGISTRY } from '@/utilities/autoTranslate/propertyFiltersFieldRegistry'
import { createGlobalAutoTranslateHook } from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslatePropertyFiltersContent: GlobalAfterChangeHook =
  createGlobalAutoTranslateHook({
    slug: 'propertyFilters',
    registry: PROPERTY_FILTERS_FIELD_REGISTRY,
  })
