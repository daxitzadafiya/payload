import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

const SKIP = { skipAutoTranslate: true, disableRevalidate: true } as const
const MARKER = 'persist-check'

type Row = {
  id?: string | number | null
  value?: string | null
  locale?: string | null
  label?: unknown
  link?: { label?: unknown } | null
}

let payload: Payload

async function loadGlobal(slug: string, locale = 'en') {
  return payload.findGlobal({
    slug: slug as never,
    locale: locale as never,
    fallbackLocale: false,
    depth: 0,
    overrideAccess: true,
  })
}

async function saveGlobal(slug: string, data: Record<string, unknown>, locale = 'en') {
  return payload.updateGlobal({
    slug: slug as never,
    locale: locale as never,
    fallbackLocale: false,
    depth: 0,
    data: data as never,
    context: SKIP,
    overrideAccess: true,
  })
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : []
}

describe('localized global saves persist (Payload)', () => {
  const originals: Record<string, unknown> = {}

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const [slug, data] of Object.entries(originals)) {
      await saveGlobal(slug, data as Record<string, unknown>)
    }
  })

  it('keeps edited Property Filters labels on every option array', async () => {
    const original = await loadGlobal('propertyFilters')
    originals.propertyFilters = {
      sortOptions: original.sortOptions,
      priceRanges: original.priceRanges,
      bedrooms: original.bedrooms,
      guests: original.guests,
    }

    const fields: { field: string; value: string }[] = [
      { field: 'sortOptions', value: 'recent' },
      { field: 'priceRanges', value: 'any' },
      { field: 'bedrooms', value: '1' },
      { field: 'guests', value: '1' },
    ]

    const seedGuests = asRows(original.guests)
    if (!seedGuests.some((row) => row.value === '1')) {
      await saveGlobal('propertyFilters', {
        guests: [
          { value: 'any', label: 'Any Guests' },
          { value: '1', label: '1 Guest' },
          { value: '2', label: '2 Guests' },
        ],
      })
    }

    const current = await loadGlobal('propertyFilters')

    for (const { field, value } of fields) {
      const rows = asRows((current as Record<string, unknown>)[field])
      const row = rows.find((item) => item.value === value)
      if (!row) continue

      const nextLabel = `${String(row.label || value)} ${MARKER}`
      const submitted = rows.map((item) =>
        item.value === value ? { ...item, label: nextLabel } : item,
      )

      const saved = await saveGlobal('propertyFilters', { [field]: submitted })
      const savedRow = asRows((saved as Record<string, unknown>)[field]).find(
        (item) => item.value === value,
      )
      expect(savedRow?.label, `${field} save response`).toBe(nextLabel)

      const reloaded = await loadGlobal('propertyFilters')
      const reloadedRow = asRows((reloaded as Record<string, unknown>)[field]).find(
        (item) => item.value === value,
      )
      expect(reloadedRow?.label, `${field} reload`).toBe(nextLabel)
    }
  })

  it('keeps a Property Filters guest string edit without overwriting other locales', async () => {
    const original = await loadGlobal('propertyFilters')
    if (!originals.propertyFilters) {
      originals.propertyFilters = { guests: original.guests }
    }

    let guests = asRows((await loadGlobal('propertyFilters')).guests)
    if (!guests.some((row) => row.value === '1')) {
      await saveGlobal('propertyFilters', {
        guests: [
          { value: 'any', label: 'Any Guests' },
          { value: '1', label: '1 Guest' },
          { value: '2', label: '2 Guests' },
        ],
      })
      guests = asRows((await loadGlobal('propertyFilters')).guests)
    }

    const nextLabel = `1 people ${MARKER}`
    const submitted = guests.map((item) =>
      item.value === '1' ? { ...item, label: nextLabel } : item,
    )

    const saved = await saveGlobal('propertyFilters', { guests: submitted })
    const savedRow = asRows(saved.guests).find((item) => item.value === '1')
    expect(savedRow?.label).toBe(nextLabel)

    const reloaded = asRows((await loadGlobal('propertyFilters')).guests).find(
      (item) => item.value === '1',
    )
    expect(reloaded?.label).toBe(nextLabel)

    const allLocales = await loadGlobal('propertyFilters', 'all')
    const allRow = asRows(allLocales.guests).find((item) => item.value === '1')
    const allLabel = allRow?.label as Record<string, string> | undefined
    expect(allLabel?.en).toBe(nextLabel)
    expect(allLabel?.nl).toBe('1 Guest')
  })

  it('keeps a Property Filters guest edit when the form submits a locale map', async () => {
    const guests = asRows((await loadGlobal('propertyFilters')).guests)
    const row = guests.find((item) => item.value === '1')
    expect(row).toBeDefined()

    const nextLabel = `1 occupant ${MARKER}`
    const submitted = guests.map((item) =>
      item.value === '1'
        ? {
            ...item,
            label: {
              en: nextLabel,
              de: '1 Guest',
              el: '1 Guest',
              fr: '1 Guest',
              es: '1 Guest',
              it: '1 Guest',
              nl: '1 Guest',
            },
          }
        : item,
    )

    const saved = await saveGlobal('propertyFilters', { guests: submitted })
    expect(asRows(saved.guests).find((item) => item.value === '1')?.label).toBe(nextLabel)

    const reloaded = asRows((await loadGlobal('propertyFilters')).guests).find(
      (item) => item.value === '1',
    )
    expect(reloaded?.label).toBe(nextLabel)
  })

  it('keeps an edited Cookie Consent title', async () => {
    const original = await loadGlobal('cookieConsent')
    originals.cookieConsent = { title: original.title }
    const previous = typeof original.title === 'string' ? original.title : 'We use cookies'
    const next = `${previous} ${MARKER}`

    const saved = await saveGlobal('cookieConsent', { title: next })
    expect(saved.title).toBe(next)

    const reloaded = await loadGlobal('cookieConsent')
    expect(reloaded.title).toBe(next)
  })

  it('keeps an edited Property Map modal title', async () => {
    const original = await loadGlobal('propertyMap')
    originals.propertyMap = { modalTitle: original.modalTitle }
    const previous =
      typeof original.modalTitle === 'string' ? original.modalTitle : 'Property Map'
    const next = `${previous} ${MARKER}`

    const saved = await saveGlobal('propertyMap', { modalTitle: next })
    expect(saved.modalTitle).toBe(next)

    const reloaded = await loadGlobal('propertyMap')
    expect(reloaded.modalTitle).toBe(next)
  })

  it('keeps an edited Localization display name without wiping other locales', async () => {
    const original = await loadGlobal('localization')
    originals.localization = { languages: original.languages }

    const rows = asRows(original.languages)
    const row = rows.find((item) => item.locale === 'en') || rows[0]
    expect(row, 'expected a site language row').toBeDefined()

    const previous = typeof row.label === 'string' ? row.label : 'English'
    const next = `${previous} ${MARKER}`
    const submitted = rows.map((item) =>
      item.id === row.id ? { ...item, label: next } : item,
    )

    const saved = await saveGlobal('localization', { languages: submitted })
    const savedRow = asRows(saved.languages).find((item) => item.id === row.id)
    expect(savedRow?.label).toBe(next)

    const reloaded = await loadGlobal('localization')
    const reloadedRow = asRows(reloaded.languages).find((item) => item.id === row.id)
    expect(reloadedRow?.label).toBe(next)
  })

  it('keeps an edited Header nav label', async () => {
    const original = await loadGlobal('header')
    originals.header = { navItems: original.navItems }

    const rows = asRows(original.navItems)
    const row = rows[0]
    expect(row, 'expected a header nav item').toBeDefined()

    const previous =
      typeof row.link?.label === 'string' ? row.link.label : 'Nav'
    const next = `${previous} ${MARKER}`
    const submitted = rows.map((item, index) =>
      index === 0
        ? { ...item, link: { ...item.link, label: next } }
        : item,
    )

    const saved = await saveGlobal('header', { navItems: submitted })
    const savedRow = asRows(saved.navItems)[0]
    expect(savedRow?.link?.label).toBe(next)

    const reloaded = await loadGlobal('header')
    expect(asRows(reloaded.navItems)[0]?.link?.label).toBe(next)
  })

  it('keeps an edited Footer tagline', async () => {
    const original = await loadGlobal('footer')
    originals.footer = { tagline: original.tagline }
    const previous = typeof original.tagline === 'string' ? original.tagline : 'Tagline'
    const next = `${previous} ${MARKER}`

    const saved = await saveGlobal('footer', { tagline: next })
    expect(saved.tagline).toBe(next)

    const reloaded = await loadGlobal('footer')
    expect(reloaded.tagline).toBe(next)
  })
})
