/**
 * Site color tokens — shared by tailwind.config.mjs and Theme → Custom CSS.
 * Each key maps to Tailwind classes: bg-{key}, text-{key}, border-{key}.
 */
export const SITE_THEME_TOKEN_DEFAULTS = {
  primary: '#84442e',
  secondary: '#c7af87',
  tertiary: '#c7af87',
  'accent-gold': '#A38E60',
  background: '#fef9f1',
  /** Transparent page canvas so section `bg-*` colors are not mixed with a solid body fill. */
  'body-background': '#ffffff00',
  surface: '#fef9f1',
  'surface-bright': '#fef9f1',
  'surface-sand': '#f2ede6',
  'surface-cream': '#fef9f1',
  'surface-dim': '#ded9d2',
  'surface-variant': '#e7e2db',
  'surface-container': '#f2ede6',
  'surface-container-low': '#f8f3ec',
  'surface-container-high': '#ece7e0',
  'surface-container-highest': '#e7e2db',
  'surface-container-lowest': '#ffffff',
  'surface-tint': '#5f5e5e',
  'on-primary': '#ffffff',
  'on-secondary': '#ffffff',
  'on-tertiary': '#ffffff',
  'on-surface': '#1d1b17',
  'on-background': '#1d1b17',
  'on-surface-variant': '#444748',
  'on-error': '#ffffff',
  'primary-container': '#1c1b1b',
  'secondary-container': '#e1dfdc',
  'tertiary-container': '#c9a84c',
  'error-container': '#ffdad6',
  'on-primary-container': '#858383',
  'on-secondary-container': '#636361',
  'on-tertiary-container': '#503d00',
  'on-error-container': '#93000a',
  'primary-fixed': '#e5e2e1',
  'primary-fixed-dim': '#c8c6c5',
  'secondary-fixed': '#e4e2df',
  'secondary-fixed-dim': '#c8c6c4',
  'tertiary-fixed': '#ffe08f',
  'tertiary-fixed-dim': '#e6c364',
  'on-primary-fixed': '#1c1b1b',
  'on-secondary-fixed': '#1b1c1a',
  'on-tertiary-fixed': '#241a00',
  'on-primary-fixed-variant': '#474746',
  'on-secondary-fixed-variant': '#474745',
  'on-tertiary-fixed-variant': '#584400',
  outline: '#747878',
  'outline-variant': '#c4c7c7',
  'inverse-surface': '#32302c',
  'inverse-on-surface': '#f5f0e9',
  'inverse-primary': '#c8c6c5',
  'deep-navy': '#1D293E',
  'medium-grey': '#6B6B6B',
  error: '#ba1a1a',
}

export const SITE_THEME_TOKEN_SECTIONS = [
  {
    comment: 'Brand — bg-primary, text-tertiary, text-accent-gold',
    tokens: ['primary', 'secondary', 'tertiary', 'accent-gold'],
  },
  {
    comment: 'Surfaces — bg-surface, bg-background, bg-surface-container-*',
    tokens: [
      'background',
      'body-background',
      'surface',
      'surface-bright',
      'surface-sand',
      'surface-cream',
      'surface-dim',
      'surface-variant',
      'surface-container',
      'surface-container-low',
      'surface-container-high',
      'surface-container-highest',
      'surface-container-lowest',
      'surface-tint',
    ],
  },
  {
    comment: 'On-color text — text-on-surface, text-on-primary',
    tokens: [
      'on-primary',
      'on-secondary',
      'on-tertiary',
      'on-surface',
      'on-background',
      'on-surface-variant',
      'on-error',
    ],
  },
  {
    comment: 'Containers — bg-tertiary-container, bg-primary-container',
    tokens: [
      'primary-container',
      'secondary-container',
      'tertiary-container',
      'error-container',
      'on-primary-container',
      'on-secondary-container',
      'on-tertiary-container',
      'on-error-container',
    ],
  },
  {
    comment: 'Fixed accents — bg-tertiary-fixed-dim',
    tokens: [
      'primary-fixed',
      'primary-fixed-dim',
      'secondary-fixed',
      'secondary-fixed-dim',
      'tertiary-fixed',
      'tertiary-fixed-dim',
      'on-primary-fixed',
      'on-secondary-fixed',
      'on-tertiary-fixed',
      'on-primary-fixed-variant',
      'on-secondary-fixed-variant',
      'on-tertiary-fixed-variant',
    ],
  },
  {
    comment: 'Borders & inverse — border-outline-variant',
    tokens: [
      'outline',
      'outline-variant',
      'inverse-surface',
      'inverse-on-surface',
      'inverse-primary',
    ],
  },
  {
    comment: 'Utility',
    tokens: ['deep-navy', 'medium-grey', 'error'],
  },
]

/** Core brand colors — used by email templates. */
export const DEFAULT_THEME_COLORS = {
  primary: SITE_THEME_TOKEN_DEFAULTS.primary,
  secondary: SITE_THEME_TOKEN_DEFAULTS.secondary,
  tertiary: SITE_THEME_TOKEN_DEFAULTS.tertiary,
  surface: SITE_THEME_TOKEN_DEFAULTS.surface,
  background: SITE_THEME_TOKEN_DEFAULTS.background,
  onSurface: SITE_THEME_TOKEN_DEFAULTS['on-surface'],
  onSurfaceVariant: SITE_THEME_TOKEN_DEFAULTS['on-surface-variant'],
  onPrimary: SITE_THEME_TOKEN_DEFAULTS['on-primary'],
  onSecondary: SITE_THEME_TOKEN_DEFAULTS['on-secondary'],
  outlineVariant: SITE_THEME_TOKEN_DEFAULTS['outline-variant'],
  surfaceContainer: SITE_THEME_TOKEN_DEFAULTS['surface-container'],
}

/** @param {Partial<typeof SITE_THEME_TOKEN_DEFAULTS>} [overrides] */
export function buildCustomCSSTemplate(overrides = {}) {
  const lines = [':root {']

  for (const section of SITE_THEME_TOKEN_SECTIONS) {
    lines.push(`  /* ${section.comment} */`)

    for (const token of section.tokens) {
      const value = overrides[token]?.trim() || SITE_THEME_TOKEN_DEFAULTS[token]
      lines.push(`  --color-${token}: ${value};`)
    }

    lines.push('')
  }

  return lines.join('\n').replace('\n\n}', '\n}')
}

export const THEME_CUSTOM_CSS_TEMPLATE = buildCustomCSSTemplate()

/** @param {string | null | undefined} customCSS */
export function resolveThemeCustomCSS(customCSS) {
  return customCSS?.trim() || THEME_CUSTOM_CSS_TEMPLATE
}

/** CSS custom property token → email theme object key. */
const EMAIL_THEME_TOKENS = [
  ['primary', 'primary'],
  ['secondary', 'secondary'],
  ['tertiary', 'tertiary'],
  ['surface', 'surface'],
  ['background', 'background'],
  ['on-surface', 'onSurface'],
  ['on-surface-variant', 'onSurfaceVariant'],
  ['on-primary', 'onPrimary'],
  ['on-secondary', 'onSecondary'],
  ['outline-variant', 'outlineVariant'],
  ['surface-container', 'surfaceContainer'],
]

/** @param {string | null | undefined} customCSS */
export function parseThemeEmailColorsFromCustomCSS(customCSS) {
  const css = resolveThemeCustomCSS(customCSS)
  /** @type {Record<string, string>} */
  const colors = { ...DEFAULT_THEME_COLORS }

  for (const [token, key] of EMAIL_THEME_TOKENS) {
    const match = new RegExp(`--color-${token}\\s*:\\s*([^;\\n]+)`, 'i').exec(css)
    const value = match?.[1]?.trim()
    if (value) colors[key] = value
  }

  return colors
}
