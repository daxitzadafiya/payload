import type { Field } from 'payload'

import { a } from '@/utilities/adminI18n'

/** Soft-delete flags for array rows (maps to existing is_deleted columns). */
export const softDeleteItemFields: Field[] = [
  {
    name: 'isDeleted',
    type: 'checkbox',
    defaultValue: false,
    index: true,
    admin: {
      hidden: true,
      disableBulkEdit: true,
      disableListColumn: true,
      disableListFilter: true,
    },
    label: a('admin.softDelete.isDeleted', 'Deleted'),
  },
  {
    name: 'deletedAt',
    type: 'date',
    admin: {
      hidden: true,
      disableBulkEdit: true,
      disableListColumn: true,
      disableListFilter: true,
    },
    label: a('admin.softDelete.deletedAt', 'Deleted At'),
  },
]
