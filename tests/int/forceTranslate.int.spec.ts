import { getPayload, type Field, type Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import config from '@/payload.config'
import { FORCE_TRANSLATE_COMPONENT } from '@/plugins/forceTranslatePlugin'
import {
  buildUpdateAtPayloadPath,
  getAtPayloadPath,
  getForceTranslateMeta,
} from '@/utilities/autoTranslate/forceTranslateField'
import {
  buildDocumentPatches,
  buildUpdateDataFromPatches,
  type DocumentFieldRegistry,
} from '@/utilities/autoTranslate/documentTranslate'
import { POST_FIELD_REGISTRY } from '@/utilities/autoTranslate/postFieldRegistry'
import { resolveTargetLocales } from '@/utilities/autoTranslate/resolveTargetLocales'

const CONTROL = FORCE_TRANSLATE_COMPONENT

function walkFields(
  fields: Field[] | undefined,
  visit: (field: Field) => void,
): void {
  if (!fields?.length) return

  for (const field of fields) {
    if (!field || typeof field !== 'object' || !('type' in field)) continue
    visit(field)

    if ('fields' in field && Array.isArray(field.fields)) walkFields(field.fields, visit)
    if (field.type === 'tabs') {
      for (const tab of field.tabs) walkFields(tab.fields, visit)
    }
    if (field.type === 'blocks' && 'blocks' in field && Array.isArray(field.blocks)) {
      for (const block of field.blocks) walkFields(block.fields, visit)
    }
  }
}

function afterInputIncludesControl(field: Field): boolean {
  const admin = 'admin' in field ? field.admin : undefined
  const components = admin && 'components' in admin ? admin.components : undefined
  const afterInput =
    components && 'afterInput' in components ? components.afterInput : undefined
  if (!afterInput) return false
  if (typeof afterInput === 'string') return afterInput === CONTROL
  return Array.isArray(afterInput) && afterInput.includes(CONTROL)
}

let payload: Payload

describe('Force Translate', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('keeps existing target copy on automatic empty-only patches', async () => {
    const registry: DocumentFieldRegistry = { strings: ['title'], richText: [] }
    const translate = async () => 'SHOULD_NOT_RUN'

    const result = await buildDocumentPatches(
      { title: 'Hello from English' },
      { title: 'Hello from English old' },
      { title: 'Bonjour' },
      registry,
      translate,
      'fr',
    )

    expect(result.hasChanges).toBe(false)
    expect(result.patches.get('title')).toEqual({ kind: 'string', value: 'Bonjour' })
  })

  it('fills empty target copy on automatic save', async () => {
    const registry: DocumentFieldRegistry = { strings: ['title'], richText: [] }
    const translate = async (text: string, locale: string) => `${locale}:${text}`

    const result = await buildDocumentPatches(
      { title: 'Hello from English' },
      { title: 'Hello from English' },
      { title: '' },
      registry,
      translate,
      'fr',
    )

    expect(result.hasChanges).toBe(true)
    expect(result.patches.get('title')).toEqual({
      kind: 'string',
      value: 'fr:Hello from English',
    })
  })

  it('does not overwrite existing labels when array row ids differ per locale', async () => {
    const registry: DocumentFieldRegistry = { strings: ['navItems[].link.label'], richText: [] }
    const translate = async () => 'SHOULD_NOT_RUN'

    const result = await buildDocumentPatches(
      { navItems: [{ id: 'en-1', link: { label: 'Home' } }] },
      { navItems: [{ id: 'en-1', link: { label: 'Home old' } }] },
      { navItems: [{ id: 'nl-9', link: { label: 'Thuis' } }] },
      registry,
      translate,
      'nl',
    )

    expect(result.hasChanges).toBe(false)
    expect(result.patches.get('navItems[en-1].link.label')).toEqual({
      kind: 'string',
      value: 'Thuis',
    })
  })

  it('translates an empty aligned array label and skips a filled sibling', async () => {
    const registry: DocumentFieldRegistry = { strings: ['navItems[].link.label'], richText: [] }
    const translate = async (text: string, locale: string) => `${locale}:${text}`

    const result = await buildDocumentPatches(
      {
        navItems: [
          { id: 'en-1', link: { label: 'Home' } },
          { id: 'en-2', link: { label: 'About' } },
        ],
      },
      {
        navItems: [
          { id: 'en-1', link: { label: 'Home' } },
          { id: 'en-2', link: { label: 'About' } },
        ],
      },
      {
        navItems: [
          { id: 'nl-1', link: { label: 'Thuis' } },
          { id: 'nl-2', link: { label: '' } },
        ],
      },
      registry,
      translate,
      'nl',
    )

    expect(result.hasChanges).toBe(true)
    expect(result.patches.get('navItems[en-1].link.label')).toEqual({
      kind: 'string',
      value: 'Thuis',
    })
    expect(result.patches.get('navItems[en-2].link.label')).toEqual({
      kind: 'string',
      value: 'nl:About',
    })
  })

  it('fills a source-identical copy after the source label changes', async () => {
    const registry: DocumentFieldRegistry = { strings: ['title'], richText: [] }
    const translate = async (text: string, locale: string) => `${locale}:${text}`

    const result = await buildDocumentPatches(
      { title: 'Apartments' },
      { title: 'Apartment' },
      { title: 'Apartments' },
      registry,
      translate,
      'nl',
    )

    expect(result.hasChanges).toBe(true)
    expect(result.patches.get('title')).toEqual({
      kind: 'string',
      value: 'nl:Apartments',
    })
  })

  it('gets and sets a nested payload path without touching siblings', () => {
    const source = {
      title: 'Home',
      layout: [
        { id: 'block-a', heading: 'Welcome', body: 'English body' },
        { id: 'block-b', heading: 'Next', body: 'Keep me' },
      ],
    }
    const target = {
      title: 'Accueil',
      layout: [
        { id: 'block-a', heading: 'Bienvenue', body: 'French body' },
        { id: 'block-b', heading: 'Suite', body: 'Keep me FR' },
      ],
    }

    expect(getAtPayloadPath(source, 'layout.0.heading')).toBe('Welcome')
    expect(getAtPayloadPath(source, 'layout.block-b.heading')).toBe('Next')

    const data = buildUpdateAtPayloadPath(target, source, 'layout.0.heading', 'Forcé')
    expect(data).toEqual({
      layout: [
        { id: 'block-a', heading: 'Forcé', body: 'French body' },
        { id: 'block-b', heading: 'Suite', body: 'Keep me FR' },
      ],
    })
  })

  it('attaches Force Translate afterInput on Pages, Posts, and Cookie Consent', () => {
    const pages = payload.config.collections.find((collection) => collection.slug === 'pages')
    const posts = payload.config.collections.find((collection) => collection.slug === 'posts')
    const cookie = payload.config.globals.find((global) => global.slug === 'cookieConsent')
    const forms = payload.config.collections.find((collection) => collection.slug === 'forms')

    expect(pages).toBeDefined()
    expect(posts).toBeDefined()
    expect(cookie).toBeDefined()

    let pageControls = 0
    walkFields(pages?.fields, (field) => {
      if (afterInputIncludesControl(field)) pageControls += 1
    })
    expect(pageControls).toBeGreaterThan(0)

    const postTitle = posts?.fields.find((field) => 'name' in field && field.name === 'title')
    expect(postTitle && afterInputIncludesControl(postTitle)).toBe(true)

    let cookieControls = 0
    walkFields(cookie?.fields, (field) => {
      if (afterInputIncludesControl(field)) cookieControls += 1
    })
    expect(cookieControls).toBeGreaterThan(0)

    let formControls = 0
    walkFields(forms?.fields, (field) => {
      if (afterInputIncludesControl(field)) formControls += 1
    })
    expect(formControls).toBe(0)
  })

  it('never includes the source language in Force Translate targets', () => {
    expect(resolveTargetLocales(['de', 'en', 'es', 'nl'], 'es')).toEqual(['de', 'en', 'nl'])
    expect(resolveTargetLocales(['de', 'en', 'es', 'nl'], 'es', ['es', 'nl'])).toEqual(['nl'])
  })

  it('registers force-translate endpoints and returns meta without an API key', async () => {
    const paths = (payload.config.endpoints ?? []).map((endpoint) => `${endpoint.method}:${endpoint.path}`)
    expect(paths).toContain('post:/force-translate')
    expect(paths).toContain('get:/force-translate/meta')

    const meta = await getForceTranslateMeta(payload)
    expect(meta).toEqual(
      expect.objectContaining({
        enabled: expect.any(Boolean),
        sourceLanguage: expect.any(String),
        targets: expect.any(Array),
      }),
    )
    expect(meta).not.toHaveProperty('apiKey')
    expect(JSON.stringify(meta)).not.toMatch(/apiKey/i)
  })

  it('builds a viable Posts force-translate update that fills empty required siblings', async () => {
    const source = {
      title: 'Market Trends',
      subtitle: 'A short summary',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              version: 1,
              children: [{ type: 'text', text: 'Hello world', version: 1 }],
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      meta: { title: 'SEO title', description: 'SEO description' },
    }
    const target = {}
    const translate = async (text: string, locale: string) => `${locale}:${text}`

    const { patches } = await buildDocumentPatches(
      source,
      source,
      target,
      POST_FIELD_REGISTRY,
      translate,
      'nl',
    )

    patches.set('title', { kind: 'string', value: 'nl:FORCED Market Trends' })

    const data = buildUpdateDataFromPatches(patches, {
      baseDoc: source,
      targetDoc: target,
      previousSourceDoc: source,
    })

    expect(data).toMatchObject({
      title: 'nl:FORCED Market Trends',
      subtitle: 'nl:A short summary',
      meta: {
        title: 'nl:SEO title',
        description: 'nl:SEO description',
      },
    })
    expect(data?.content).toBeTruthy()
  })

  it('keeps unique Posts translations when force-filling empty siblings only', async () => {
    const source = {
      title: 'Market Trends',
      subtitle: 'A short summary',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              version: 1,
              children: [{ type: 'text', text: 'Hello world', version: 1 }],
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    }
    const target = {
      title: 'Tendencias del mercado',
      subtitle: 'Un resumen corto',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              version: 1,
              children: [{ type: 'text', text: 'Hola mundo', version: 1 }],
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    }
    const translate = async () => 'SHOULD_NOT_RUN'

    const { patches, hasChanges } = await buildDocumentPatches(
      source,
      source,
      target,
      POST_FIELD_REGISTRY,
      translate,
      'es',
    )

    expect(hasChanges).toBe(false)
    expect(patches.get('title')).toEqual({ kind: 'string', value: 'Tendencias del mercado' })
    expect(patches.get('subtitle')).toEqual({ kind: 'string', value: 'Un resumen corto' })
  })
})
