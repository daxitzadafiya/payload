import {
  buildGoogleFontsStylesheetUrl,
  getActiveGoogleFontFamily,
  THEME_FONT_MODE_GOOGLE,
} from '@/globals/Theme/googleFonts'
import { resolveThemeCustomCSS } from '@/globals/Theme/siteThemeTokens.mjs'

/**
 * Maps Theme → Custom CSS (`--color-*`) onto Payload admin chrome + custom.scss tokens.
 * Keeps model02 villa / dark-glass layout; colors follow Theme at runtime.
 */
export function buildAdminThemeBridgeCSS(): string {
  return `
:root,
html[data-theme='light'],
html[data-theme='dark'] {
  --admin-ink: var(--color-on-surface, #1a1714);
  --admin-primary: var(--color-primary, #84442e);
  --admin-secondary: var(--color-secondary, #553E75);
  --admin-on-secondary: var(--color-on-secondary, #ffffff);
  --admin-tertiary: var(--color-secondary, var(--color-tertiary, #553E75));
  --admin-tertiary-soft: var(--color-tertiary-container, var(--color-accent-gold, #A38E60));
  --admin-cream: var(--color-surface-cream, var(--color-background, #fef9f1));
  /* Fallbacks match pre-theme admin ladder (#faf7f2 / #ebe4da / #efeae3). */
  --admin-sand: var(--color-surface-container-low, #faf7f2);
  --admin-surface: var(--color-surface-container, #ebe4da);
  --admin-paper: var(--color-surface-container-lowest, #fffcf8);
  --admin-muted: var(--color-on-surface-variant, #444748);
  --admin-outline: var(--color-outline-variant, #c4c7c7);
  --admin-stone: var(--color-surface-sand, #efeae3);
}

html[data-theme='light'] {
  /*
   * Payload list zebra: odd rows use --theme-elevation-50 over --theme-bg.
   * Cream/background ≈ surface-container-low, so mapping bg to cream kills striping.
   * Rebuild the pre-theme stone canvas + light odd-row step from Theme tokens.
   */
  --theme-bg: var(--admin-stone, #efeae3);
  --theme-elevation-0: var(--admin-paper, #fffcf8);
  --theme-elevation-50: color-mix(in srgb, var(--admin-paper, #fffcf8) 72%, var(--admin-stone, #efeae3) 28%);
  --theme-elevation-100: color-mix(in srgb, var(--admin-surface, #ebe4da) 65%, var(--admin-stone, #efeae3) 35%);
  --theme-elevation-150: var(--color-surface-container-high, #e3dbcf);
  --theme-elevation-200: var(--color-surface-container-highest, #ddd3c4);
  --theme-border-color: color-mix(in srgb, var(--admin-ink) 10%, transparent);
  --theme-text: var(--color-on-surface, var(--admin-ink));
  --theme-success-100: color-mix(in srgb, var(--admin-tertiary) 12%, white);
  --theme-success-250: color-mix(in srgb, var(--admin-tertiary-soft) 70%, white);
  --theme-success-400: var(--admin-tertiary-soft);
  --theme-success-500: var(--admin-tertiary);
  --theme-success-600: var(--admin-primary);
  --theme-success-800: var(--color-on-tertiary-container, #5c2f20);
}

html[data-theme='light'] .btn--style-primary {
  --bg-color: var(--admin-primary);
  --color: var(--color-on-primary, #ffffff);
  --hover-bg: var(--admin-tertiary);
  --hover-color: var(--admin-ink);
}
`.trim()
}

export function resolveAdminThemeFontCSS(args: {
  fontMode?: string | null
  googleFonts?: Array<{ family?: string | null; active?: boolean | null }> | null
}): {
  fontCSS: string
  stylesheetUrl: string | null
} {
  const outfit = "'Outfit', ui-sans-serif, system-ui, sans-serif"

  if (args.fontMode === THEME_FONT_MODE_GOOGLE) {
    const family = getActiveGoogleFontFamily(args.googleFonts)
    if (family) {
      const quoted = `'${family.replace(/'/g, "\\'")}'`
      const stack = `${quoted}, ui-sans-serif, system-ui, sans-serif`
      return {
        fontCSS: `:root {\n  --font-theme-body: ${stack};\n  --font-theme-headline: ${stack};\n}\n`,
        stylesheetUrl: buildGoogleFontsStylesheetUrl(family),
      }
    }
  }

  return {
    fontCSS: `:root {\n  --font-theme-body: ${outfit};\n  --font-theme-headline: ${outfit};\n}\n`,
    stylesheetUrl: null,
  }
}

export function buildAdminThemeStylePayload(args: {
  customCSS?: string | null
  fontMode?: string | null
  googleFonts?: Array<{ family?: string | null; active?: boolean | null }> | null
}): {
  css: string
  stylesheetUrl: string | null
} {
  const themeCSS = resolveThemeCustomCSS(args.customCSS).replace(/\r\n/g, '\n')
  const fonts = resolveAdminThemeFontCSS({
    fontMode: args.fontMode,
    googleFonts: args.googleFonts,
  })

  return {
    css: `${fonts.fontCSS}${themeCSS}\n${buildAdminThemeBridgeCSS()}\n`,
    stylesheetUrl: fonts.stylesheetUrl,
  }
}
