import type { Block, Config, Endpoint, Field, Plugin, Tab } from 'payload'

import {
  forceTranslateEndpoint,
  forceTranslateMetaEndpoint,
} from '@/utilities/autoTranslate/forceTranslateEndpoint'
import {
  FORCE_TRANSLATE_COLLECTIONS,
  FORCE_TRANSLATE_GLOBALS,
} from '@/utilities/autoTranslate/forceTranslateField'

export const FORCE_TRANSLATE_COMPONENT =
  '@/utilities/autoTranslate/ForceTranslateControl#ForceTranslateControl'

const SKIPPED_FIELD_NAMES = new Set(['url', 'slug'])

function asComponentList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string') return [value]
  return []
}

function appendForceTranslateControl(field: Field): Field {
  if (!('name' in field) || typeof field.name !== 'string') return field
  if (SKIPPED_FIELD_NAMES.has(field.name)) return field
  if (!('localized' in field) || field.localized !== true) return field
  if (field.type !== 'text' && field.type !== 'textarea' && field.type !== 'richText') {
    return field
  }

  const admin = field.admin ?? {}
  const components = ('components' in admin ? admin.components : undefined) ?? {}
  const afterInput = asComponentList(
    'afterInput' in components ? components.afterInput : undefined,
  )
  if (afterInput.includes(FORCE_TRANSLATE_COMPONENT)) return field

  return {
    ...field,
    admin: {
      ...admin,
      components: {
        ...components,
        afterInput: [...afterInput, FORCE_TRANSLATE_COMPONENT],
      },
    },
  } as Field
}

function attachToTabs(tabs: Tab[]): Tab[] {
  return tabs.map((tab) => ({
    ...tab,
    fields: attachForceTranslateFields(tab.fields ?? []),
  }))
}

function attachToBlocks(blocks: Block[] | undefined): Block[] {
  if (!blocks?.length) return blocks ?? []

  return blocks.map((block) => ({
    ...block,
    fields: attachForceTranslateFields(block.fields ?? []),
  }))
}

export function attachForceTranslateFields(fields: Field[] | undefined): Field[] {
  if (!fields?.length) return fields ?? []

  return fields.map((field) => {
    if (!field || typeof field !== 'object' || !('type' in field)) return field

    const withControl = appendForceTranslateControl(field)

    switch (withControl.type) {
      case 'array':
      case 'group':
      case 'collapsible':
      case 'row': {
        if (!('fields' in withControl) || !Array.isArray(withControl.fields)) return withControl
        return {
          ...withControl,
          fields: attachForceTranslateFields(withControl.fields),
        }
      }
      case 'tabs': {
        return {
          ...withControl,
          tabs: attachToTabs(withControl.tabs),
        }
      }
      case 'blocks': {
        if (!('blocks' in withControl) || !Array.isArray(withControl.blocks)) return withControl
        return {
          ...withControl,
          blocks: attachToBlocks(withControl.blocks),
        }
      }
      default:
        return withControl
    }
  })
}

export const forceTranslatePlugin =
  (): Plugin =>
  (config: Config): Config => {
    const collections = (config.collections || []).map((collection) => {
      if (!(FORCE_TRANSLATE_COLLECTIONS as readonly string[]).includes(collection.slug)) {
        return collection
      }
      return {
        ...collection,
        fields: attachForceTranslateFields(collection.fields),
      }
    })

    const globals = (config.globals || []).map((global) => {
      if (!(FORCE_TRANSLATE_GLOBALS as readonly string[]).includes(global.slug)) {
        return global
      }
      return {
        ...global,
        fields: attachForceTranslateFields(global.fields),
      }
    })

    const existingEndpoints = (config.endpoints || []) as Endpoint[]
    const endpoints: Endpoint[] = [
      ...existingEndpoints.filter(
        (endpoint) =>
          endpoint.path !== '/force-translate' && endpoint.path !== '/force-translate/meta',
      ),
      forceTranslateMetaEndpoint,
      forceTranslateEndpoint,
    ]

    return {
      ...config,
      collections,
      globals,
      endpoints,
    }
  }
