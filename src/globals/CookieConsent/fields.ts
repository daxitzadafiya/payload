import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const cookieConsentFields: Field[] = [
  {
    name: 'enabled',
    type: 'checkbox',
    defaultValue: true,
    label: a('admin.cookieConsent.enabled', 'Show cookie banner'),
  },
  {
    name: 'showCloseButton',
    type: 'checkbox',
    defaultValue: true,
    label: a('admin.cookieConsent.showCloseButton', 'Show close button'),
    admin: {
      description: a(
        'admin.cookieConsent.showCloseButton.description',
        'Lets visitors dismiss the banner for this session without saving a choice.',
      ),
    },
  },
  {
    name: 'title',
    type: 'text',
    localized: true,
    label: a('admin.cookieConsent.title', 'Title'),
    defaultValue: 'We use cookies',
    admin: {
      description: a(
        'admin.cookieConsent.title.description',
        'Short heading shown in the banner. Edit in English only. Other languages refresh via DeepL when English changes on save.',
      ),
    },
  },
  {
    name: 'content',
    type: 'richText',
    localized: true,
    label: a('admin.cookieConsent.content', 'Cookie message'),
    admin: {
      description: a(
        'admin.cookieConsent.content.description',
        'Explain which cookies you use and why. Shown in the banner body. Edit in English only. Other languages refresh via DeepL when English changes on save.',
      ),
    },
    editor: lexicalEditor({
      features: ({ rootFeatures }) => [
        ...rootFeatures,
        FixedToolbarFeature(),
        InlineToolbarFeature(),
      ],
    }),
  },
  {
    type: 'row',
    fields: [
      {
        name: 'acceptLabel',
        type: 'text',
        localized: true,
        defaultValue: 'Accept all',
        required: true,
        label: a('admin.cookieConsent.acceptLabel', 'Accept Label'),
        admin: {
          width: '50%',
          description: a(
            'admin.cookieConsent.acceptLabel.description',
            'Edit in English only. Other languages refresh via DeepL when English changes on save.',
          ),
        },
      },
      {
        name: 'rejectLabel',
        type: 'text',
        localized: true,
        defaultValue: 'Reject non-essential',
        label: a('admin.cookieConsent.rejectLabel', 'Reject Label'),
        admin: {
          width: '50%',
          description: a(
            'admin.cookieConsent.rejectLabel.description',
            'Leave empty to hide the reject button. Edit in English only. Other languages refresh via DeepL when English changes on save.',
          ),
        },
      },
    ],
  },
  link({
    appearances: false,
    overrides: {
      name: 'policyLink',
      label: a('admin.cookieConsent.policyLink', 'Cookie / privacy policy link'),
      admin: {
        description: a(
          'admin.cookieConsent.policyLink.description',
          'Optional link to your cookie or privacy policy page. Link label: Edit in English only. Other languages refresh via DeepL when English changes on save.',
        ),
      },
    },
  }),
  {
    type: 'row',
    fields: [
      {
        name: 'storageKey',
        type: 'text',
        defaultValue: 'horizon-cookie-consent',
        required: true,
        label: a('admin.cookieConsent.storageKey', 'Storage Key'),
        admin: {
          width: '50%',
          description: a(
            'admin.cookieConsent.storageKey.description',
            'Browser cookie name used to remember the visitor choice.',
          ),
        },
      },
      {
        name: 'expiryDays',
        type: 'number',
        defaultValue: 365,
        min: 1,
        max: 3650,
        required: true,
        label: a('admin.cookieConsent.expiryDays', 'Expiry Days'),
        admin: {
          width: '50%',
          description: a(
            'admin.cookieConsent.expiryDays.description',
            'How long the choice is remembered (days).',
          ),
        },
      },
    ],
  },
]
