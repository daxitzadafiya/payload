import type { Field } from 'payload'

import type { SoftDeleteFieldSpec } from './softDeleteConfig'
import { softDeleteItemFields } from './softDeleteFields'

function hasSoftDeleteFields(fields: Field[]): boolean {
  return fields.some((field) => 'name' in field && field.name === 'isDeleted')
}

function ensureSoftDeleteFields(fields: Field[]): Field[] {
  if (hasSoftDeleteFields(fields)) return fields
  return [...fields, ...softDeleteItemFields]
}

function injectIntoArrayFields(
  fields: Field[],
  spec: SoftDeleteFieldSpec,
  nested: string[],
): Field[] {
  return fields.map((field) => {
    if (field.type === 'array' && 'name' in field && nested.includes(field.name)) {
      return {
        ...field,
        fields: ensureSoftDeleteFields(field.fields || []),
      }
    }

    if (field.type === 'tabs' && field.tabs) {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: injectIntoArrayFields(tab.fields, spec, nested),
        })),
      }
    }

    if (field.type === 'row' && field.fields) {
      return {
        ...field,
        fields: injectIntoArrayFields(field.fields, spec, nested),
      }
    }

    if (field.type === 'group' && field.fields) {
      return {
        ...field,
        fields: injectIntoArrayFields(field.fields, spec, nested),
      }
    }

    return field
  })
}

/** Inject hidden isDeleted/deletedAt fields into configured array rows. */
export function injectSoftDeleteFields(
  fields: Field[],
  specs: SoftDeleteFieldSpec[],
): Field[] {
  if (specs.length === 0) return fields

  const specByField = new Map(specs.map((spec) => [spec.field, spec]))

  return fields.map((field) => {
    if (field.type === 'array' && 'name' in field && specByField.has(field.name)) {
      const spec = specByField.get(field.name)!
      const withNested = injectIntoArrayFields(field.fields || [], spec, spec.nested || [])
      return {
        ...field,
        fields: ensureSoftDeleteFields(withNested),
      }
    }

    if (field.type === 'tabs' && field.tabs) {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: injectSoftDeleteFields(tab.fields, specs),
        })),
      }
    }

    if (field.type === 'row' && field.fields) {
      return {
        ...field,
        fields: injectSoftDeleteFields(field.fields, specs),
      }
    }

    if (field.type === 'group' && field.fields) {
      return {
        ...field,
        fields: injectSoftDeleteFields(field.fields, specs),
      }
    }

    return field
  })
}
