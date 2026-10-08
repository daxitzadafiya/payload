import type { CollectionConfig } from 'payload'

import { a } from '@/utilities/adminI18n'
import { authenticated } from '../../access/authenticated'
import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
} from '@/email/forgotPasswordEmail'

import { syncAdminLocaleOnLogin } from './hooks/syncAdminLocaleOnLogin'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: a('admin.users.singular', 'User'),
    plural: a('admin.users.plural', 'Users'),
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: generateForgotPasswordEmailHTML,
      generateEmailSubject: generateForgotPasswordEmailSubject,
    },
  },
  hooks: {
    afterLogin: [syncAdminLocaleOnLogin],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: a('admin.users.fields.name', 'Name'),
    },
    {
      name: 'roles',
      type: 'select',
      label: a('admin.users.fields.roles', 'Roles'),
      hasMany: true,
      options: [
        { label: a('admin.users.roles.admin', 'admin'), value: 'admin' },
        { label: a('admin.users.roles.editor', 'editor'), value: 'editor' },
        { label: a('admin.users.roles.user', 'user'), value: 'user' },
      ],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) =>
          Boolean(user?.collection === 'users' && user.roles.includes('admin')),
      },
    },
  ],
  timestamps: true,
}
