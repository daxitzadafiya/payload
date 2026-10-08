import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { a } from '@/utilities/adminI18n'
import { invalidateEmailTransportCache } from '@/email/dynamicEmailTransport'
import { defaultClientConfirmationContent } from '@/email/defaultClientConfirmationContent'
import { defaultDocumentDownloadContent } from '@/email/defaultDocumentDownloadContent'
import { emailTemplateFields } from '@/fields/emailTemplateFields'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const EmailSettings: GlobalConfig = {
  slug: 'emailSettings',
  label: a('admin.emailSettings.label', 'Email settings'),
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.emailSettings.description',
      'SMTP credentials, notification recipient, and client confirmation email templates.',
    ),
    group: a('admin.groups.settings', 'Settings'),
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: a('admin.emailSettings.enabled', 'Enable email sending'),
    },
    {
      type: 'tabs',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
      tabs: [
        {
          label: a('admin.emailSettings.tabs.smtpDelivery', 'SMTP & delivery'),
          fields: [
            {
              name: 'smtp',
              type: 'group',
              label: a('admin.emailSettings.smtp', 'SMTP'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'host',
                      type: 'text',
                      required: true,
                      label: a('admin.emailSettings.smtp.host', 'Host'),
                      admin: {
                        width: '70%',
                        description: a(
                          'admin.emailSettings.smtp.host.description',
                          'SMTP server hostname (e.g. smtp.gmail.com).',
                        ),
                      },
                    },
                    {
                      name: 'port',
                      type: 'number',
                      defaultValue: 587,
                      required: true,
                      label: a('admin.emailSettings.smtp.port', 'Port'),
                      admin: {
                        width: '30%',
                      },
                    },
                  ],
                },
                {
                  name: 'secure',
                  type: 'checkbox',
                  defaultValue: false,
                  label: a('admin.emailSettings.smtp.secure', 'Use TLS'),
                  admin: {
                    description: a(
                      'admin.emailSettings.smtp.secure.description',
                      'Enable for implicit TLS on port 465. Leave off for STARTTLS on port 587.',
                    ),
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'user',
                      type: 'text',
                      required: true,
                      label: a('admin.emailSettings.smtp.user', 'User'),
                      admin: {
                        width: '50%',
                        description: a(
                          'admin.emailSettings.smtp.user.description',
                          'SMTP username (e.g. your email address for Gmail).',
                        ),
                      },
                    },
                    {
                      name: 'password',
                      type: 'text',
                      required: true,
                      label: a('admin.emailSettings.smtp.password', 'Password'),
                      admin: {
                        width: '50%',
                        description: a(
                          'admin.emailSettings.smtp.password.description',
                          'SMTP password or app-specific password.',
                        ),
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'sender',
              type: 'group',
              label: a('admin.emailSettings.sender', 'Sender'),
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fromAddress',
                      type: 'email',
                      required: true,
                      label: a('admin.emailSettings.sender.fromAddress', 'From Address'),
                      admin: {
                        width: '50%',
                        description: a(
                          'admin.emailSettings.sender.fromAddress.description',
                          'From address shown on outgoing emails.',
                        ),
                      },
                    },
                    {
                      name: 'fromName',
                      type: 'text',
                      required: true,
                      defaultValue: 'Horizon Estates',
                      label: a('admin.emailSettings.sender.fromName', 'From Name'),
                      admin: {
                        width: '50%',
                        description: a(
                          'admin.emailSettings.sender.fromName.description',
                          'From name shown on outgoing emails.',
                        ),
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'notifications',
              type: 'group',
              fields: [
                {
                  name: 'recipientAddress',
                  type: 'email',
                  required: true,
                  label: a('admin.emailSettings.notifications.recipientAddress', 'Notification recipient'),
                  admin: {
                    description: a(
                      'admin.emailSettings.notifications.recipientAddress.description',
                      'Where contact, property inquiry, and holiday booking notifications are delivered (your team inbox).',
                    ),
                  },
                },
              ],
            },
          ],
        },
        {
          label: a('admin.emailSettings.tabs.clientTemplate', 'Customize client email template'),
          description: a(
            'admin.emailSettings.tabs.clientTemplate.description',
            'Automated thank-you email sent to the visitor after form submission. Use the locale switcher in the admin bar to edit English, Spanish, German, and other languages — like the language tabs in your CRM.',
          ),
          fields: [
            {
              name: 'clientConfirmation',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: a(
                    'admin.emailSettings.clientConfirmation.enabled',
                    'Send confirmation email to client',
                  ),
                },
                {
                  name: 'contact',
                  type: 'group',
                  label: a('admin.emailSettings.clientConfirmation.contact', 'Contact form'),
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                  fields: emailTemplateFields({
                    subject: 'Thank you for your enquiry',
                    content: defaultClientConfirmationContent,
                  }),
                },
                {
                  name: 'propertyInquiry',
                  type: 'group',
                  label: a('admin.emailSettings.clientConfirmation.propertyInquiry', 'Property inquiry'),
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                  fields: emailTemplateFields({
                    subject: 'Enquiry about property (Ref: {{reference}})',
                    content: defaultClientConfirmationContent,
                  }),
                },
                {
                  name: 'holidayBooking',
                  type: 'group',
                  label: a(
                    'admin.emailSettings.clientConfirmation.holidayBooking',
                    'Holiday rental booking',
                  ),
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                    description: a(
                      'admin.emailSettings.clientConfirmation.holidayBooking.description',
                      'Thank-you email after a holiday rental booking enquiry. Use {{reference}}, {{arrival}}, {{departure}}, and {{guests}} in the subject or body.',
                    ),
                  },
                  fields: emailTemplateFields({
                    subject: 'Holiday booking enquiry (Ref: {{reference}})',
                    content: defaultClientConfirmationContent,
                  }),
                },
                {
                  name: 'saveSearch',
                  type: 'group',
                  label: a(
                    'admin.emailSettings.clientConfirmation.saveSearch',
                    'Save search',
                  ),
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                    description: a(
                      'admin.emailSettings.clientConfirmation.saveSearch.description',
                      'Thank-you email after a visitor saves a property search. Edit subject and body per locale like the other confirmation templates.',
                    ),
                  },
                  fields: emailTemplateFields({
                    subject: 'Thank you for saving your search',
                    content: defaultClientConfirmationContent,
                  }),
                },
                {
                  name: 'documentDownload',
                  type: 'group',
                  label: a(
                    'admin.emailSettings.clientConfirmation.documentDownload',
                    'Document download',
                  ),
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                    description: a(
                      'admin.emailSettings.clientConfirmation.documentDownload.description',
                      'Sent only to the visitor. The subject can be edited here. This message is shown under the availability row. Placeholders: {{downloadUrl}}, {{action}}, {{document}}, {{pageUrl}}, and {{reference}}.',
                    ),
                  },
                  fields: emailTemplateFields({
                    subject: 'Your document download link',
                    content: defaultDocumentDownloadContent,
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateEmailTransportCache()
        await revalidateCacheTag('global_emailSettings')
      },
    ],
  },
}
