import { SITE_THEME_TOKEN_DEFAULTS } from './src/globals/Theme/siteThemeTokens.mjs'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/blocks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/Header/**/*.{js,ts,jsx,tsx,mdx}',
    './src/Footer/**/*.{js,ts,jsx,tsx,mdx}',
    './src/heros/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: Object.fromEntries(
        Object.keys(SITE_THEME_TOKEN_DEFAULTS).map((token) => [
          token,
          `var(--color-${token}, ${SITE_THEME_TOKEN_DEFAULTS[token]})`,
        ]),
      ),
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        gutter: '24px',
        'margin-desktop': '80px',
        'margin-tablet': '40px',
        'max-width': '1440px',
        'margin-mobile': '20px',
        'stack-unit': '8px',
      },
      fontFamily: {
        'body-md': ['var(--font-theme-body, var(--font-outfit))', 'sans-serif'],
        'label-nav': ['var(--font-theme-body, var(--font-outfit))', 'sans-serif'],
        'headline-lg-mobile': ['var(--font-theme-headline, var(--font-eb-garamond))', 'serif'],
        'headline-md': ['var(--font-theme-headline, var(--font-eb-garamond))', 'serif'],
        'headline-lg': ['var(--font-theme-headline, var(--font-eb-garamond))', 'serif'],
        'body-lg': ['var(--font-theme-body, var(--font-outfit))', 'sans-serif'],
        'display-lg': ['var(--font-theme-headline, var(--font-eb-garamond))', 'serif'],
        'label-sm': ['var(--font-theme-body, var(--font-outfit))', 'sans-serif'],
        'headline-sm': ['var(--font-theme-headline, var(--font-eb-garamond))', 'serif'],
      },
      fontSize: {
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-nav': [
          '13px',
          {
            lineHeight: '16px',
            letterSpacing: '0.15em',
            fontWeight: '500',
          },
        ],
        'headline-lg-mobile': ['36px', { lineHeight: '44px', fontWeight: '400' }],
        'headline-md': ['32px', { lineHeight: '40px', fontWeight: '400' }],
        'headline-lg': ['48px', { lineHeight: '56px', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '300' }],
        'display-lg': [
          '64px',
          {
            lineHeight: '72px',
            letterSpacing: '-0.02em',
            fontWeight: '400',
          },
        ],
        'label-sm': [
          '12px',
          {
            lineHeight: '16px',
            letterSpacing: '0.05em',
            fontWeight: '600',
          },
        ],
        'headline-sm': ['24px', { lineHeight: '32px', fontWeight: '500' }],
      },
      typography: {
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--text)',
              '--tw-prose-headings': 'var(--text)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      },
    },
  },
}

export default config
