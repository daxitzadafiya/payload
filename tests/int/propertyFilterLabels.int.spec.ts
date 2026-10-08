import { describe, expect, it } from 'vitest'

import {
  dropEmptyOptionRows,
  ensureLocalizedOptionLabel,
  fillAllLocaleLabels,
  flattenOptionLabelsForSave,
} from '@/globals/PropertyFilters/hooks/ensureOptionLabels'
import type { FieldHookArgs } from 'payload'

const LOCALES = ['en', 'de', 'el', 'fr', 'es', 'it', 'nl'] as const

function runHook(
  args: Partial<FieldHookArgs> & { siblingData: Record<string, unknown> },
) {
  return ensureLocalizedOptionLabel({
    req: {
      locale: 'es',
      payload: { config: { localization: { localeCodes: [...LOCALES] } } },
    },
    siblingDocWithLocales: {},
    value: undefined,
    ...args,
  } as FieldHookArgs)
}

describe('property filter option labels', () => {
  it('seeds every CMS locale so version inserts are never null', () => {
    const siblingDocWithLocales: { label?: Record<string, string> } = {}

    const result = runHook({
      siblingData: { value: '10m+', min: '10000000', max: 'any' },
      siblingDocWithLocales,
      value: undefined,
    })

    expect(result).toBe('10m+')
    expect(siblingDocWithLocales.label).toEqual({
      en: '10m+',
      de: '10m+',
      el: '10m+',
      fr: '10m+',
      es: '10m+',
      it: '10m+',
      nl: '10m+',
    })
  })

  it('keeps existing translations when filling missing locales', () => {
    expect(
      fillAllLocaleLabels(
        { en: 'Any Price', es: 'Cualquier precio', de: null, nl: '' },
        'any',
        LOCALES,
      ),
    ).toEqual({
      en: 'Any Price',
      de: 'Any Price',
      el: 'Any Price',
      fr: 'Any Price',
      es: 'Cualquier precio',
      it: 'Any Price',
      nl: 'Any Price',
    })
  })

  it('backfills an empty label from value on new array rows', () => {
    const rows = dropEmptyOptionRows([
      { value: '10m+', min: '10000000', max: 'any' },
      { value: '', label: '', min: '', max: '' },
    ])

    expect(rows).toEqual([{ value: '10m+', min: '10000000', max: 'any', label: '10m+' }])
  })

  it('does not replace a typed label with the value-seeded 500k-600k copy', () => {
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, '500k-600k'])),
    }

    const result = runHook({
      siblingData: { value: '500k-600k', min: '500000', max: '600000' },
      siblingDocWithLocales,
      value: '€ 500 000 - € 600 000',
    })

    expect(result).toBe('€ 500 000 - € 600 000')
    expect(siblingDocWithLocales.label.es).toBe('€ 500 000 - € 600 000')
    expect(siblingDocWithLocales.label.en).toBe('500k-600k')
  })

  it('keeps real translations when only the current locale is edited', () => {
    const siblingDocWithLocales = {
      label: {
        en: '€500k - €600k',
        de: '500.000 € - 600.000 €',
        el: '500k-600k',
        fr: '500k-600k',
        es: '500k-600k',
        it: '500k-600k',
        nl: '500k-600k',
      },
    }

    const result = runHook({
      siblingData: { value: '500k-600k', min: '500000', max: '600000' },
      siblingDocWithLocales,
      value: '€ 500 000 - € 600 000',
    })

    expect(result).toBe('€ 500 000 - € 600 000')
    expect(siblingDocWithLocales.label).toEqual({
      en: '€500k - €600k',
      de: '500.000 € - 600.000 €',
      el: '500k-600k',
      fr: '500k-600k',
      es: '€ 500 000 - € 600 000',
      it: '500k-600k',
      nl: '500k-600k',
    })
  })

  it('keeps existing labels in other locales when the current locale is edited', () => {
    const previous = '€ 900 000 - 1m'
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, previous])),
    }

    const result = runHook({
      previousValue: previous,
      siblingData: { value: '900k-1m', min: '900000', max: '1000000' },
      siblingDocWithLocales,
      value: '€ 900 000 - 1 millón',
    })

    expect(result).toBe('€ 900 000 - 1 millón')
    expect(typeof result).toBe('string')
    expect(siblingDocWithLocales.label.es).toBe('€ 900 000 - 1 millón')
    expect(siblingDocWithLocales.label.en).toBe(previous)
    expect(siblingDocWithLocales.label.nl).toBe(previous)
  })

  it('returns a string when the form submits a locale map so Payload does not nest it', () => {
    const previous = '€ 900 000 - 1m'
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, previous])),
    }

    const result = runHook({
      previousValue: previous,
      siblingData: { value: '900k-1m', min: '900000', max: '1000000' },
      siblingDocWithLocales,
      value: {
        ...Object.fromEntries(LOCALES.map((locale) => [locale, previous])),
        es: '€ 900 000 - 1 millón',
      },
    })

    expect(result).toBe('€ 900 000 - 1 millón')
    expect(siblingDocWithLocales.label.es).toBe('€ 900 000 - 1 millón')
    expect(siblingDocWithLocales.label.en).toBe(previous)
  })

  it('flattens locale-map labels to the current locale before nested field hooks', () => {
    const rows = flattenOptionLabelsForSave(
      [
        {
          value: '900k-1m',
          label: {
            en: '€ 900 000 - 1m',
            es: '€ 900 000 - 1 millón',
          },
        },
      ],
      'es',
    )

    expect(rows).toEqual([{ value: '900k-1m', label: '€ 900 000 - 1 millón' }])
  })

  it('fills placeholder locales from an English save so DeepL can translate them', () => {
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, '500k-1m'])),
    }

    const result = runHook({
      req: {
        locale: 'en',
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '500k-1m', min: '500000', max: '1000000' },
      siblingDocWithLocales,
      value: '€500k - €1M',
    })

    expect(result).toBe('€500k - €1M')
    expect(siblingDocWithLocales.label).toEqual({
      en: '€500k - €1M',
      de: '€500k - €1M',
      el: '€500k - €1M',
      fr: '€500k - €1M',
      es: '€500k - €1M',
      it: '€500k - €1M',
      nl: '€500k - €1M',
    })
  })

  it('does not copy a source-language label over an existing translation', () => {
    const siblingDocWithLocales = {
      label: {
        en: 'Apartments',
        de: 'Wohnungen',
        el: 'Apartments',
        fr: 'Appartements',
        es: 'Apartamentos',
        it: 'Appartamenti',
        nl: 'Appartementen',
      },
    }

    const result = runHook({
      req: {
        locale: 'en',
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: 'apt', min: '', max: '' },
      siblingDocWithLocales,
      value: 'Apartment homes',
    })

    expect(result).toBe('Apartment homes')
    expect(siblingDocWithLocales.label).toEqual({
      en: 'Apartment homes',
      de: 'Wohnungen',
      el: 'Apartments',
      fr: 'Appartements',
      es: 'Apartamentos',
      it: 'Appartamenti',
      nl: 'Appartementen',
    })
  })

  it('does not copy a Force Translate target string onto the source locale', () => {
    const source = 'huésped 01'
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, source])),
    }

    const result = runHook({
      context: { autoTranslating: true, skipAutoTranslate: true, forceTranslateTargetLocale: 'nl' },
      previousValue: source,
      req: {
        locale: 'nl',
        context: { autoTranslating: true, skipAutoTranslate: true, forceTranslateTargetLocale: 'nl' },
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '1', min: '', max: '' },
      siblingDocWithLocales,
      value: 'Gast 01',
    })

    expect(result).toBe('Gast 01')
    expect(siblingDocWithLocales.label.nl).toBe('Gast 01')
    expect(siblingDocWithLocales.label.en).toBe(source)
    expect(siblingDocWithLocales.label.es).toBe(source)
  })

  it('does not restore a stale source label during a target-locale DeepL write', () => {
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, '1 Guest'])),
    }

    const result = runHook({
      context: { autoTranslating: true, skipAutoTranslate: true, forceTranslateTargetLocale: 'nl' },
      req: {
        locale: 'nl',
        context: { autoTranslating: true, skipAutoTranslate: true, forceTranslateTargetLocale: 'nl' },
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '1', min: '', max: '' },
      siblingDocWithLocales,
      value: '1 gast',
    })

    expect(result).toBe('1 gast')
    expect(siblingDocWithLocales.label.nl).toBe('1 gast')
    expect(siblingDocWithLocales.label.en).toBe('1 Guest')
  })

  it('does not treat skipAutoTranslate as a DeepL write', () => {
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, '1 Guest'])),
    }

    const result = runHook({
      context: { skipAutoTranslate: true, disableRevalidate: true },
      req: {
        locale: 'en',
        context: { skipAutoTranslate: true, disableRevalidate: true },
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '1', min: '', max: '' },
      siblingDocWithLocales,
      value: '1 people',
    })

    expect(result).toBe('1 people')
    expect(siblingDocWithLocales.label.en).toBe('1 people')
    expect(siblingDocWithLocales.label.nl).toBe('1 Guest')
    expect(siblingDocWithLocales.label.es).toBe('1 Guest')
  })

  it('keeps the edited source label when other locales still have the old copy', () => {
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, '1 Guest'])),
    }

    const result = runHook({
      req: {
        locale: 'en',
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '1', min: '', max: '' },
      siblingDocWithLocales,
      value: '1 people',
    })

    expect(result).toBe('1 people')
    expect(siblingDocWithLocales.label.en).toBe('1 people')
    expect(siblingDocWithLocales.label.nl).toBe('1 Guest')
    expect(siblingDocWithLocales.label.es).toBe('1 Guest')
  })

  it('keeps a string edit when req.locale is missing (mergeLocaleActions uses the locale map)', () => {
    const siblingDocWithLocales = {
      label: Object.fromEntries(LOCALES.map((locale) => [locale, '1 Guest'])),
    }

    const result = runHook({
      req: {
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '1', min: '', max: '' },
      siblingDocWithLocales,
      value: '1 people',
    })

    expect(result).toBe('1 people')
    expect(siblingDocWithLocales.label.en).toBe('1 people')
    expect(siblingDocWithLocales.label.nl).toBe('1 Guest')
  })

  it('persists a Spanish Price Range edit and leaves English alone', () => {
    const stored = {
      en: '€500k - €1M',
      de: '500.000 € - 1 Mio. €',
      el: '€500k - €1M',
      fr: '500 000 € - 1 M€',
      es: '500 000 € - 1 millón de €',
      it: '500.000 € - 1 mln €',
      nl: '€500k - €1M',
    }
    const siblingDocWithLocales = { label: { ...stored } }

    const result = runHook({
      previousValue: stored.es,
      req: {
        locale: 'es',
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '500k-1m', min: '500000', max: '1000000' },
      siblingDocWithLocales,
      value: 'Cualquier precio',
    })

    expect(result).toBe('Cualquier precio')
    expect(siblingDocWithLocales.label.es).toBe('Cualquier precio')
    expect(siblingDocWithLocales.label.en).toBe('€500k - €1M')
    expect(siblingDocWithLocales.label.de).toBe('500.000 € - 1 Mio. €')
  })

  it('uses ?locale=es when findGlobal left req.locale as all', () => {
    const stored = {
      en: '€500k - €1M',
      de: '500.000 € - 1 Mio. €',
      el: '€500k - €1M',
      fr: '500 000 € - 1 M€',
      es: '500 000 € - 1 millón de €',
      it: '500.000 € - 1 mln €',
      nl: '€500k - €1M',
    }
    const siblingDocWithLocales = { label: { ...stored } }
    const req = {
      locale: 'all',
      query: { locale: 'es' },
      payload: { config: { localization: { localeCodes: [...LOCALES] } } },
    }

    const result = runHook({
      previousValue: stored.es,
      req: req as FieldHookArgs['req'],
      siblingData: { value: '500k-1m', min: '500000', max: '1000000' },
      siblingDocWithLocales,
      value: 'Cualquier precio',
    })

    expect(result).toBe('Cualquier precio')
    expect(req.locale).toBe('es')
    expect(siblingDocWithLocales.label.es).toBe('Cualquier precio')
    expect(siblingDocWithLocales.label.en).toBe('€500k - €1M')
  })

  it('updates only the locale that still has the previous Spanish string', () => {
    const stored = {
      en: '€500k - €1M',
      de: '500.000 € - 1 Mio. €',
      el: '€500k - €1M',
      fr: '500 000 € - 1 M€',
      es: '500 000 € - 1 millón de €',
      it: '500.000 € - 1 mln €',
      nl: '€500k - €1M',
    }
    const siblingDocWithLocales = { label: { ...stored } }

    const result = runHook({
      previousValue: stored.es,
      req: {
        payload: { config: { localization: { localeCodes: [...LOCALES] } } },
      },
      siblingData: { value: '500k-1m', min: '500000', max: '1000000' },
      siblingDocWithLocales,
      value: 'Cualquier precio',
    })

    expect(result).toBe('Cualquier precio')
    expect(siblingDocWithLocales.label.es).toBe('Cualquier precio')
    expect(siblingDocWithLocales.label.en).toBe('€500k - €1M')
  })
})
