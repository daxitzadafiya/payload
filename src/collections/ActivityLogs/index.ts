import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { a } from '@/utilities/adminI18n'

const denyAll = () => false

export const ActivityLogs: CollectionConfig = {
  slug: 'activity-logs',
  labels: {
    singular: a('admin.activityLogs.singular', 'Activity Log'),
    plural: a('admin.activityLogs.plural', 'Activity Logs'),
  },
  access: {
    create: denyAll,
    delete: denyAll,
    read: authenticated,
    update: denyAll,
  },
  admin: {
    useAsTitle: 'documentTitle',
    defaultColumns: [
      'action',
      'localeLabel',
      'section',
      'documentTitle',
      'actorLabel',
      'changesSummary',
      'timestamp',
    ],
    description: a(
      'admin.activityLogs.description',
      'Read-only audit trail of create, update, delete, and restore actions across collections, globals, and settings.',
    ),
  },
  disableDuplicate: true,
  fields: [
    {
      type: 'group',
      label: a('admin.activityLogs.fields.details', 'Details'),
      admin: {
        hideGutter: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'action',
              type: 'select',
              required: true,
              index: true,
              options: [
                { label: a('admin.activityLogs.actions.create', 'Create'), value: 'create' },
                { label: a('admin.activityLogs.actions.update', 'Update'), value: 'update' },
                { label: a('admin.activityLogs.actions.delete', 'Delete'), value: 'delete' },
                { label: a('admin.activityLogs.actions.restore', 'Restore'), value: 'restore' },
              ],
              label: a('admin.activityLogs.fields.action', 'Action'),
              admin: { readOnly: true, width: '25%' },
            },
            {
              name: 'module',
              type: 'select',
              required: true,
              index: true,
              options: [
                {
                  label: a('admin.activityLogs.modules.collections', 'Collections'),
                  value: 'Collections',
                },
                { label: a('admin.activityLogs.modules.globals', 'Globals'), value: 'Globals' },
                { label: a('admin.activityLogs.modules.settings', 'Settings'), value: 'Settings' },
                { label: a('admin.activityLogs.modules.mcp', 'MCP'), value: 'MCP' },
              ],
              label: a('admin.activityLogs.fields.module', 'Module'),
              admin: { readOnly: true, width: '25%' },
            },
            {
              name: 'section',
              type: 'text',
              required: true,
              index: true,
              label: a('admin.activityLogs.fields.section', 'Section'),
              admin: { readOnly: true, width: '25%' },
            },
            {
              name: 'localeLabel',
              type: 'text',
              index: true,
              label: a('admin.activityLogs.fields.localeLabel', 'Language'),
              admin: { readOnly: true, width: '25%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'documentId',
              type: 'text',
              required: true,
              index: true,
              label: a('admin.activityLogs.fields.documentId', 'Document ID'),
              admin: {
                readOnly: true,
                width: '25%',
                disableListColumn: true,
              },
            },
            {
              name: 'documentTitle',
              type: 'text',
              label: a('admin.activityLogs.fields.documentTitle', 'Document Title'),
              admin: { readOnly: true, width: '25%' },
            },
            {
              name: 'actorLabel',
              type: 'text',
              required: true,
              defaultValue: 'System',
              index: true,
              label: a('admin.activityLogs.fields.updatedBy', 'Updated By'),
              admin: { readOnly: true, width: '25%' },
            },
            {
              name: 'timestamp',
              type: 'date',
              required: true,
              index: true,
              label: a('admin.activityLogs.fields.timestamp', 'Timestamp'),
              admin: {
                readOnly: true,
                width: '25%',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
        },
        {
          name: 'changesSummary',
          type: 'textarea',
          label: a('admin.activityLogs.fields.changesSummary', 'Changes summary'),
          admin: {
            readOnly: true,
            description: a(
              'admin.activityLogs.fields.changesSummaryDescription',
              'Short preview of what changed — full details are below.',
            ),
          },
        },
      ],
    },
    {
      name: 'locale',
      type: 'text',
      index: true,
      label: a('admin.activityLogs.fields.locale', 'Language code'),
      admin: {
        readOnly: true,
        hidden: true,
        disableListColumn: true,
      },
    },
    // Stored for filtering / integrity; not shown — Updated By already displays the name
    {
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: a('admin.activityLogs.fields.updatedByUser', 'User account'),
      admin: {
        readOnly: true,
        hidden: true,
        disableListColumn: true,
      },
    },
    {
      name: 'changesView',
      type: 'ui',
      label: a('admin.activityLogs.fields.changes', 'Changes'),
      admin: {
        disableListColumn: true,
        components: {
          Field: '@/components/ActivityLog/ChangesDiffView#ChangesDiffView',
        },
      },
    },
    {
      name: 'changes',
      type: 'array',
      label: a('admin.activityLogs.fields.changesRaw', 'Changes (raw)'),
      admin: {
        readOnly: true,
        hidden: true,
        disableListColumn: true,
      },
      fields: [
        {
          name: 'field',
          type: 'text',
          required: true,
          label: a('admin.activityLogs.fields.changeField', 'Field'),
        },
        {
          name: 'oldValue',
          type: 'textarea',
          label: a('admin.activityLogs.fields.oldValue', 'Old Value'),
        },
        {
          name: 'newValue',
          type: 'textarea',
          label: a('admin.activityLogs.fields.newValue', 'New Value'),
        },
      ],
    },
  ],
  timestamps: true,
}
