import type { Field, SelectField } from 'payload'

import { a } from '@/utilities/adminI18n'

export const FOOTER_COLUMN_WIDTH_OPTIONS = [
  { label: 'col-2', value: '2' },
  { label: 'col-3', value: '3' },
  { label: 'col-4', value: '4' },
] as const

export type FooterColumnWidth = (typeof FOOTER_COLUMN_WIDTH_OPTIONS)[number]['value']

type SectionLayoutOptions = {
  /** Prefix used for field names, e.g. `brand` → `brandShowOnSite`. */
  prefix: string
  defaultOrder: number
  defaultColumnWidth?: FooterColumnWidth
  /** Bottom bar is full-width; skip order/width controls. */
  includeLayout?: boolean
}

/**
 * Shared “Show on site” (+ optional order / column width) controls for each footer tab.
 */
export function sectionLayoutFields({
  prefix,
  defaultOrder,
  defaultColumnWidth = '3',
  includeLayout = true,
}: SectionLayoutOptions): Field[] {
  const showOnSite: Field = {
    name: `${prefix}ShowOnSite`,
    type: 'checkbox',
    label: a('admin.footer.section.showOnSite', 'Show on site'),
    defaultValue: true,
    admin: {
      description: a(
        'admin.footer.section.showOnSite.description',
        'When unchecked, this section is hidden on the site.',
      ),
      width: includeLayout ? '33%' : '100%',
    },
  }

  if (!includeLayout) {
    return [showOnSite]
  }

  const displayOrder: Field = {
    name: `${prefix}DisplayOrder`,
    type: 'number',
    label: a('admin.footer.section.displayOrder', 'Display order'),
    defaultValue: defaultOrder,
    min: 1,
    admin: {
      description: a(
        'admin.footer.section.displayOrder.description',
        'Lower numbers appear first. Sections with the same order keep the default left-to-right order.',
      ),
      width: '33%',
      step: 1,
    },
  }

  const columnWidth: SelectField = {
    name: `${prefix}ColumnWidth`,
    type: 'select',
    label: a('admin.footer.section.columnWidth', 'Column width'),
    defaultValue: defaultColumnWidth,
    options: [...FOOTER_COLUMN_WIDTH_OPTIONS],
    admin: {
      description: a(
        'admin.footer.section.columnWidth.description',
        'Desktop grid width (12-column grid). Four col-3 sections fill one row.',
      ),
      width: '34%',
    },
  }

  return [
    {
      type: 'row',
      fields: [showOnSite, displayOrder, columnWidth],
    },
  ]
}
