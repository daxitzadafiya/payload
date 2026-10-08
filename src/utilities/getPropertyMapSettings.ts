import type { PropertyMap } from '@/payload-types'

import { SITE_THEME_TOKEN_DEFAULTS } from '@/globals/Theme/siteThemeTokens.mjs'
import { getCachedGlobal } from '@/utilities/getGlobals'

export type PropertyMapSettings = {
  modalTitle: string
  defaultCenter: { lat: number; lng: number }
  defaultZoom: number
  minZoom: number
  maxZoom: number
  enableDrawSearch: boolean
  drawInstructionText: string
  drawButtonLabel: string
  clusterColors: { small: string; medium: string; large: string }
  mapFetchLimit: number
}

const DEFAULT_SETTINGS: PropertyMapSettings = {
  modalTitle: 'Property Map',
  defaultCenter: { lat: 38.3452, lng: -0.481 },
  defaultZoom: 8,
  minZoom: 5,
  maxZoom: 18,
  enableDrawSearch: true,
  drawInstructionText: 'Draw A Shape Around The Region(S) You Would Like To Search',
  drawButtonLabel: 'Draw your area on the map',
  clusterColors: {
    small: SITE_THEME_TOKEN_DEFAULTS.primary,
    medium: SITE_THEME_TOKEN_DEFAULTS.primary,
    large: SITE_THEME_TOKEN_DEFAULTS.primary,
  },
  mapFetchLimit: 5000,
}

export function normalizePropertyMapSettings(
  doc: PropertyMap | null | undefined,
): PropertyMapSettings {
  if (!doc) return DEFAULT_SETTINGS

  const lat = doc.defaultCenter?.lat
  const lng = doc.defaultCenter?.lng

  return {
    modalTitle: doc.modalTitle?.trim() || DEFAULT_SETTINGS.modalTitle,
    defaultCenter: {
      lat:
        typeof lat === 'number' && Number.isFinite(lat) ? lat : DEFAULT_SETTINGS.defaultCenter.lat,
      lng:
        typeof lng === 'number' && Number.isFinite(lng) ? lng : DEFAULT_SETTINGS.defaultCenter.lng,
    },
    defaultZoom:
      typeof doc.defaultZoom === 'number' && doc.defaultZoom >= 1
        ? doc.defaultZoom
        : DEFAULT_SETTINGS.defaultZoom,
    minZoom:
      typeof doc.minZoom === 'number' && doc.minZoom >= 1 ? doc.minZoom : DEFAULT_SETTINGS.minZoom,
    maxZoom:
      typeof doc.maxZoom === 'number' && doc.maxZoom >= 1 ? doc.maxZoom : DEFAULT_SETTINGS.maxZoom,
    enableDrawSearch: doc.enableDrawSearch !== false,
    drawInstructionText: doc.drawInstructionText?.trim() || DEFAULT_SETTINGS.drawInstructionText,
    drawButtonLabel: doc.drawButtonLabel?.trim() || DEFAULT_SETTINGS.drawButtonLabel,
    clusterColors: {
      small: doc.clusterColors?.small?.trim() || DEFAULT_SETTINGS.clusterColors.small,
      medium: doc.clusterColors?.medium?.trim() || DEFAULT_SETTINGS.clusterColors.medium,
      large: doc.clusterColors?.large?.trim() || DEFAULT_SETTINGS.clusterColors.large,
    },
    mapFetchLimit:
      typeof doc.mapFetchLimit === 'number' && doc.mapFetchLimit >= 1
        ? doc.mapFetchLimit
        : DEFAULT_SETTINGS.mapFetchLimit,
  }
}

export async function getPropertyMapSettings(locale?: string): Promise<PropertyMapSettings> {
  const getGlobal = getCachedGlobal('propertyMap', 0, locale as never)
  const doc = await getGlobal()
  return normalizePropertyMapSettings(doc)
}
