import type { ArrayField, Field } from 'payload'

import type { LinkAppearances } from './link'

import { a } from '@/utilities/adminI18n'
import deepMerge from '@/utilities/deepMerge'
import { link } from './link'

type LinkGroupType = (options?: {
  appearances?: LinkAppearances[] | false
  overrides?: Partial<ArrayField>
}) => Field

export const linkGroup: LinkGroupType = ({ appearances, overrides = {} } = {}) => {
  const generatedLinkGroup: Field = {
    name: 'links',
    type: 'array',
    label: a('admin.fields.linkGroup.label', 'Links'),
    labels: {
      singular: a('admin.fields.linkGroup.singular', 'Link'),
      plural: a('admin.fields.linkGroup.plural', 'Links'),
    },
    fields: [
      link({
        appearances,
      }),
    ],
    admin: {
      initCollapsed: true,
    },
  }

  return deepMerge(generatedLinkGroup, overrides)
}
