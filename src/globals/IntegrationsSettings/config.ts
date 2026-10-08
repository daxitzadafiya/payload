import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { a, aString } from '@/utilities/adminI18n'
import { invalidateIntegrationsSettingsCache } from '@/settings/integrations/client'
import { parseVirtualAssistantEmbedScript } from '@/settings/integrations/shared'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const IntegrationsSettings: GlobalConfig = {
  slug: 'integrationsSettings',
  label: a('admin.integrationsSettings.label', 'Integrations'),
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.integrationsSettings.description',
      'Third-party integrations for Google Maps, reCAPTCHA, WhatsApp, and Virtual Assistant. Stored in the database — not in environment variables.',
    ),
    group: a('admin.groups.settings', 'Settings'),
  },
  fields: [
    {
      name: 'googleMaps',
      type: 'group',
      label: a('admin.integrationsSettings.googleMaps', 'Google Maps'),
      fields: [
        {
          name: 'apiKey',
          type: 'text',
          label: a('admin.integrationsSettings.googleMaps.apiKey', 'Maps API key'),
          admin: {
            description: a(
              'admin.integrationsSettings.googleMaps.apiKey.description',
              'Used by the property search map modal.',
            ),
          },
        },
      ],
    },
    {
      name: 'recaptcha',
      type: 'group',
      label: a('admin.integrationsSettings.recaptcha', 'reCAPTCHA'),
      fields: [
        {
          name: 'siteKey',
          type: 'text',
          label: a('admin.integrationsSettings.recaptcha.siteKey', 'Site key'),
          required: true,
          admin: {
            description: a(
              'admin.integrationsSettings.recaptcha.siteKey.description',
              'Public key shown in the contact form widget.',
            ),
          },
        },
        {
          name: 'secretKey',
          type: 'text',
          label: a('admin.integrationsSettings.recaptcha.secretKey', 'Secret key'),
          required: true,
          admin: {
            description: a(
              'admin.integrationsSettings.recaptcha.secretKey.description',
              'Server-side key for verifying form submissions.',
            ),
          },
        },
      ],
    },
    {
      name: 'whatsapp',
      type: 'group',
      label: a('admin.integrationsSettings.whatsapp', 'WhatsApp'),
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: a(
            'admin.integrationsSettings.whatsapp.enabled',
            'Enable WhatsApp button on the website',
          ),
          defaultValue: false,
          admin: {
            description: a(
              'admin.integrationsSettings.whatsapp.enabled.description',
              'Show a floating WhatsApp chat button on the website.',
            ),
          },
        },
        {
          name: 'phoneNumber',
          type: 'text',
          label: a('admin.integrationsSettings.whatsapp.phoneNumber', 'Phone number'),
          admin: {
            description: a(
              'admin.integrationsSettings.whatsapp.phoneNumber.description',
              'Full international number, e.g. +34604225709. Used for https://wa.me/… links.',
            ),
            condition: (_, siblingData) => siblingData?.enabled === true,
          },
          validate: (value: unknown, { siblingData, req }: { siblingData?: unknown; req?: { i18n?: { language?: string } } }) => {
            if (siblingData && typeof siblingData === 'object' && 'enabled' in siblingData) {
              const enabled = (siblingData as { enabled?: boolean }).enabled
              if (enabled && (!value || !String(value).trim())) {
                return aString(
                  'admin.integrationsSettings.whatsapp.phoneNumberRequired',
                  'Phone number is required when WhatsApp is enabled',
                  req?.i18n?.language,
                )
              }
            }
            return true
          },
        },
        {
          name: 'position',
          type: 'select',
          label: a('admin.integrationsSettings.whatsapp.position', 'Button position'),
          defaultValue: 'right',
          options: [
            {
              label: a('admin.integrationsSettings.whatsapp.position.bottomRight', 'Bottom right'),
              value: 'right',
            },
            {
              label: a('admin.integrationsSettings.whatsapp.position.bottomLeft', 'Bottom left'),
              value: 'left',
            },
          ],
          admin: {
            description: a(
              'admin.integrationsSettings.whatsapp.position.description',
              'Corner where the floating button appears.',
            ),
            condition: (_, siblingData) => siblingData?.enabled === true,
          },
        },
      ],
    },
    {
      name: 'virtualAssistant',
      type: 'group',
      label: a('admin.integrationsSettings.virtualAssistant', 'Virtual Assistant'),
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: a(
            'admin.integrationsSettings.virtualAssistant.enabled',
            'Enable Virtual Assistant on the website',
          ),
          defaultValue: false,
          admin: {
            description: a(
              'admin.integrationsSettings.virtualAssistant.enabled.description',
              'Load the Optima webchat widget script on the frontend.',
            ),
          },
        },
        {
          name: 'embedScript',
          type: 'textarea',
          label: a('admin.integrationsSettings.virtualAssistant.embedScript', 'Embed script'),
          admin: {
            description: a(
              'admin.integrationsSettings.virtualAssistant.embedScript.description',
              'Paste the full script tag, e.g. <script src="https://webchat-api.optimasit.com/widget.js" data-agency-key="your-key" async></script>',
            ),
            condition: (_, siblingData) => siblingData?.enabled === true,
            rows: 4,
          },
          validate: (value: unknown, { siblingData, req }: { siblingData?: unknown; req?: { i18n?: { language?: string } } }) => {
            if (!(siblingData && typeof siblingData === 'object' && 'enabled' in siblingData)) {
              return true
            }
            if ((siblingData as { enabled?: boolean }).enabled !== true) return true
            if (!value || !String(value).trim()) {
              return aString(
                'admin.integrationsSettings.virtualAssistant.embedScriptRequired',
                'Embed script is required when Virtual Assistant is enabled',
                req?.i18n?.language,
              )
            }
            const parsed = parseVirtualAssistantEmbedScript(String(value))
            if (!parsed) {
              return aString(
                'admin.integrationsSettings.virtualAssistant.embedScriptInvalid',
                'Script must include a https:// src and data-agency-key="…"',
                req?.i18n?.language,
              )
            }
            return true
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateIntegrationsSettingsCache()
        await revalidateCacheTag('global_integrationsSettings')
      },
    ],
  },
}
