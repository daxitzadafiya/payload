import type { Logo as LogoGlobal, Media } from '@/payload-types'
import { DEFAULT_APP_NAME } from '@/utilities/getAppName'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export const DEFAULT_LIGHT_LOGO = '/logo.png'
export const DEFAULT_DARK_LOGO = '/logow.png'
export const DEFAULT_LOGO_ALT = DEFAULT_APP_NAME
export const DEFAULT_FAVICON = '/favicon.ico'

export type LogoSources = {
  lightSrc: string
  darkSrc: string
  alt: string
  width: number
  height: number
}

function getMediaSrc(media: Media | number | null | undefined): string | undefined {
  if (media && typeof media === 'object' && media.url) {
    return getMediaUrl(media.url, media.updatedAt)
  }
}

function getMediaDimensions(
  media: Media | number | null | undefined,
): Pick<LogoSources, 'width' | 'height'> {
  if (media && typeof media === 'object') {
    return {
      width: media.width ?? 193,
      height: media.height ?? 34,
    }
  }

  return { width: 193, height: 34 }
}

export function getLogoSources(logo?: LogoGlobal | null): LogoSources {
  const lightLogo = logo?.lightLogo
  const darkLogo = logo?.darkLogo
  const dimensions = getMediaDimensions(
    lightLogo && typeof lightLogo === 'object' ? lightLogo : darkLogo,
  )

  return {
    lightSrc: getMediaSrc(lightLogo) ?? DEFAULT_LIGHT_LOGO,
    darkSrc: getMediaSrc(darkLogo) ?? DEFAULT_DARK_LOGO,
    alt: logo?.alt || DEFAULT_LOGO_ALT,
    ...dimensions,
  }
}

export function getFaviconSource(logo?: LogoGlobal | null): string {
  return getMediaSrc(logo?.favicon) ?? DEFAULT_FAVICON
}
