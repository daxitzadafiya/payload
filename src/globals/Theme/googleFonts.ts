export const THEME_FONT_MODE_SITE_DEFAULT = 'site-default' as const
export const THEME_FONT_MODE_GOOGLE = 'google' as const

export type ThemeFontMode =
  | typeof THEME_FONT_MODE_SITE_DEFAULT
  | typeof THEME_FONT_MODE_GOOGLE

export const THEME_FONT_MODE_OPTIONS = [
  { label: 'Site default (Outfit + EB Garamond)', value: THEME_FONT_MODE_SITE_DEFAULT },
  { label: 'Custom Google Font', value: THEME_FONT_MODE_GOOGLE },
] as const

/** Starter library — admins can add/remove any Google Font family name. */
export const DEFAULT_THEME_GOOGLE_FONTS = [
  { family: 'Figtree', active: true },
  { family: 'Inter', active: false },
  { family: 'Outfit', active: false },
  { family: 'EB Garamond', active: false },
  { family: 'Poppins', active: false },
  { family: 'Montserrat', active: false },
  { family: 'Lora', active: false },
  { family: 'Playfair Display', active: false },
  { family: 'Roboto', active: false },
  { family: 'Source Sans 3', active: false },
]

export type ThemeGoogleFontEntry = {
  family?: string | null
  active?: boolean | null
  id?: string | null
}

/** Exact Google Fonts family name → CSS family stack. */
export function sanitizeGoogleFontFamily(family?: string | null): string | null {
  if (!family) return null
  const trimmed = family.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  // Block characters that would break CSS/URL injection.
  if (!/^[A-Za-z0-9][A-Za-z0-9 &'+-]*$/.test(trimmed)) return null
  return trimmed
}

export function getActiveGoogleFontFamily(
  fonts?: ThemeGoogleFontEntry[] | null,
): string | null {
  if (!fonts?.length) return null
  const active = fonts.find((f) => f.active && sanitizeGoogleFontFamily(f.family))
  if (active?.family) return sanitizeGoogleFontFamily(active.family)
  // Fall back to first valid entry if none marked active.
  for (const font of fonts) {
    const family = sanitizeGoogleFontFamily(font.family)
    if (family) return family
  }
  return null
}

export const SITE_DEFAULT_BODY_FONT_FAMILY = 'Outfit'
export const SITE_DEFAULT_HEADLINE_FONT_FAMILY = 'EB Garamond'

/** Google Fonts CSS2 stylesheet URL for a family name. */
export function buildGoogleFontsStylesheetUrl(family: string): string {
  return buildGoogleFontsStylesheetUrlForFamilies([family])
}

/** Google Fonts CSS2 stylesheet URL for one or more family names. */
export function buildGoogleFontsStylesheetUrlForFamilies(families: string[]): string {
  const params = families.map((family) => {
    const encoded = encodeURIComponent(family).replace(/%20/g, '+')
    return `family=${encoded}:ital,wght@0,300..900;1,300..900`
  })
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`
}

export type ResolvedEmailFonts = {
  bodyFamily: string
  headlineFamily: string
  bodyGeneric: 'sans-serif'
  headlineGeneric: 'serif' | 'sans-serif'
  stylesheetUrl: string
}

/** Email-safe font families from Theme (Outfit + EB Garamond, or the active Google Font). */
export function resolveEmailFontsFromTheme(args: {
  fontMode?: string | null
  googleFonts?: ThemeGoogleFontEntry[] | null
}): ResolvedEmailFonts {
  const mode =
    args.fontMode === THEME_FONT_MODE_GOOGLE ? THEME_FONT_MODE_GOOGLE : THEME_FONT_MODE_SITE_DEFAULT

  if (mode === THEME_FONT_MODE_GOOGLE) {
    const family = getActiveGoogleFontFamily(args.googleFonts)
    if (family) {
      return {
        bodyFamily: family,
        headlineFamily: family,
        bodyGeneric: 'sans-serif',
        headlineGeneric: 'sans-serif',
        stylesheetUrl: buildGoogleFontsStylesheetUrl(family),
      }
    }
  }

  return {
    bodyFamily: SITE_DEFAULT_BODY_FONT_FAMILY,
    headlineFamily: SITE_DEFAULT_HEADLINE_FONT_FAMILY,
    bodyGeneric: 'sans-serif',
    headlineGeneric: 'serif',
    stylesheetUrl: buildGoogleFontsStylesheetUrlForFamilies([
      SITE_DEFAULT_HEADLINE_FONT_FAMILY,
      SITE_DEFAULT_BODY_FONT_FAMILY,
    ]),
  }
}

export function resolveThemeFontVars(args: {
  fontMode?: string | null
  googleFonts?: ThemeGoogleFontEntry[] | null
}): {
  body: string
  headline: string
  googleFontFamily: string | null
  stylesheetUrl: string | null
} {
  const mode = args.fontMode === THEME_FONT_MODE_GOOGLE ? THEME_FONT_MODE_GOOGLE : THEME_FONT_MODE_SITE_DEFAULT

  if (mode === THEME_FONT_MODE_SITE_DEFAULT) {
    return {
      body: 'var(--font-outfit)',
      headline: 'var(--font-eb-garamond)',
      googleFontFamily: null,
      stylesheetUrl: null,
    }
  }

  const family = getActiveGoogleFontFamily(args.googleFonts)
  if (!family) {
    return {
      body: 'var(--font-outfit)',
      headline: 'var(--font-eb-garamond)',
      googleFontFamily: null,
      stylesheetUrl: null,
    }
  }

  const quoted = `'${family.replace(/'/g, "\\'")}'`
  const stack = `${quoted}, ui-sans-serif, system-ui, sans-serif`

  return {
    body: stack,
    headline: stack,
    googleFontFamily: family,
    stylesheetUrl: buildGoogleFontsStylesheetUrl(family),
  }
}

/** Keep at most one active font; prefer the last checked row. */
export function normalizeGoogleFontsActive(
  fonts: ThemeGoogleFontEntry[] | null | undefined,
): ThemeGoogleFontEntry[] {
  if (!fonts?.length) return []

  let lastActiveIndex = -1
  fonts.forEach((font, index) => {
    if (font.active) lastActiveIndex = index
  })

  return fonts.map((font, index) => ({
    ...font,
    family: sanitizeGoogleFontFamily(font.family) ?? font.family?.trim() ?? '',
    active: lastActiveIndex >= 0 ? index === lastActiveIndex : index === 0,
  }))
}
