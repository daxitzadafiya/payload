import type { Field, GroupField, StaticLabel } from 'payload'

import { a } from '@/utilities/adminI18n'
import deepMerge from '@/utilities/deepMerge'

export type LinkAppearances = 'default' | 'outline'

export const appearanceOptions: Record<LinkAppearances, { label: StaticLabel; value: string }> = {
  default: {
    label: a('admin.fields.link.appearanceDefault', 'Default'),
    value: 'default',
  },
  outline: {
    label: a('admin.fields.link.appearanceOutline', 'Outline'),
    value: 'outline',
  },
}

type LinkOverrides = Partial<GroupField> & {
  /** Short DB identifier when nested paths exceed SQLite's 63-char limit */
  dbName?: string
}

type LinkType = (options?: {
  appearances?: LinkAppearances[] | false
  disableLabel?: boolean
  overrides?: LinkOverrides
}) => Field

export const link: LinkType = ({ appearances, disableLabel = false, overrides = {} } = {}) => {
  const linkResult: GroupField = {
    name: 'link',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            label: a('admin.fields.link.type', 'Type'),
            admin: {
              layout: 'horizontal',
              width: '50%',
            },
            defaultValue: 'reference',
            options: [
              {
                label: a('admin.fields.link.typeInternal', 'Internal link'),
                value: 'reference',
              },
              {
                label: a('admin.fields.link.typeCustom', 'Custom URL'),
                value: 'custom',
              },
            ],
          },
          {
            name: 'newTab',
            type: 'checkbox',
            admin: {
              style: {
                alignSelf: 'flex-end',
              },
              width: '50%',
            },
            label: a('admin.fields.link.newTab', 'Open in new tab'),
          },
        ],
      },
    ],
  }

  const linkTypes: Field[] = [
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
      label: a('admin.fields.link.reference', 'Document to link to'),
      relationTo: ['pages', 'posts'],
      required: false,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'custom',
      },
      label: a('admin.fields.link.url', 'Custom URL'),
      localized: true,
      required: true,
    },
  ]

  if (!disableLabel) {
    linkTypes.map((linkType) => ({
      ...linkType,
      admin: {
        ...linkType.admin,
        width: '50%',
      },
    }))

    linkResult.fields.push({
      type: 'row',
      fields: [
        ...linkTypes,
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: a('admin.fields.link.label', 'Label'),
          required: true,
          localized: true,
        },
      ],
    })
  } else {
    linkResult.fields = [...linkResult.fields, ...linkTypes]
  }

  if (appearances !== false) {
    let appearanceOptionsToUse = [appearanceOptions.default, appearanceOptions.outline]

    if (appearances) {
      appearanceOptionsToUse = appearances.map((appearance) => appearanceOptions[appearance])
    }

    linkResult.fields.push({
      name: 'appearance',
      type: 'select',
      label: a('admin.fields.link.appearance', 'Appearance'),
      admin: {
        description: a(
          'admin.fields.link.appearanceDescription',
          'Choose how the link should be rendered.',
        ),
      },
      defaultValue: 'default',
      options: appearanceOptionsToUse,
    })
  }

  return deepMerge(linkResult, overrides)
}
