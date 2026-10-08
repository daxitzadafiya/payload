import type { Field } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'
import { softDeleteItemFields } from '@/plugins/trashAndVersions/softDeleteFields'

import { sectionLayoutFields } from './sectionLayoutFields'

export const footerFields: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        label: a('admin.footer.tabs.brand', 'Brand'),
        fields: [
          ...sectionLayoutFields({ prefix: 'brand', defaultOrder: 1 }),
          {
            name: 'tagline',
            type: 'textarea',
            localized: true,
            label: a('admin.footer.tagline', 'Tagline'),
            defaultValue:
              'Elevating the Greek real estate experience through heritage, transparency, and architectural excellence.',
            admin: {
              description: a(
                'admin.footer.tagline.description',
                'Short description shown below the logo.',
              ),
            },
          },
          {
            name: 'socialLinks',
            type: 'array',
            label: a('admin.footer.socialLinks', 'Social Links'),
            labels: {
              singular: a('admin.footer.socialLinkSingular', 'Social Link'),
              plural: a('admin.footer.socialLinksPlural', 'Social Links'),
            },
            admin: {
        description: a(
          'admin.footer.socialLinks.description',
          'Social or external links shown as icons. Removing a row moves it to Globals Trash.',
        ),
              initCollapsed: true,
              components: {
                RowLabel: '@/Footer/SocialRowLabel#SocialRowLabel',
              },
            },
            fields: [
              {
                name: 'icon',
                type: 'text',
                required: true,
                label: a('admin.footer.socialLinks.icon', 'Icon'),
                admin: {
                  description: a(
                    'admin.footer.socialLinks.icon.description',
                    'icon name (e.g. FiPhone, FiMail, FiMapPin). you can use from https://react-icons.github.io/react-icons/icons/fi/',
                  ),
                },
              },
              {
                name: 'url',
                type: 'text',
                required: true,
                label: a('admin.footer.socialLinks.url', 'URL'),
              },
              {
                name: 'newTab',
                type: 'checkbox',
                defaultValue: true,
                label: a('admin.footer.socialLinks.newTab', 'Open in new tab'),
              },
            ],
          },
        ],
      },
      {
        label: a('admin.footer.tabs.quickLinks', 'Quick Links'),
        fields: [
          ...sectionLayoutFields({ prefix: 'quickLinks', defaultOrder: 2 }),
          {
            name: 'quickLinksTitle',
            type: 'text',
            localized: true,
            label: a('admin.footer.quickLinksTitle', 'Quick Links Title'),
            defaultValue: 'QUICK LINKS',
          },
          {
            name: 'navItems',
            type: 'array',
            localized: true,
            label: a('admin.footer.navItems', 'Nav Items'),
            labels: {
              singular: a('admin.footer.navItemSingular', 'Nav Item'),
              plural: a('admin.footer.navItemsPlural', 'Nav Items'),
            },
            fields: [
              link({
                appearances: false,
              }),
              ...softDeleteItemFields,
            ],
            admin: {
              description: a(
                'admin.footer.navItems.description',
                'Footer links for the current locale (switch locale in the admin bar to edit each language). Removing an item moves it to Globals Trash (soft delete).',
              ),
              initCollapsed: true,
              components: {
                RowLabel: '@/Footer/RowLabel#RowLabel',
              },
            },
          },
        ],
      },
      {
        label: a('admin.footer.tabs.contact', 'Contact'),
        fields: [
          ...sectionLayoutFields({ prefix: 'contact', defaultOrder: 3 }),
          {
            name: 'contactTitle',
            type: 'text',
            localized: true,
            label: a('admin.footer.contactTitle', 'Contact Title'),
            defaultValue: 'CONTACT US',
          },
          {
            name: 'contact',
            type: 'group',
            label: a('admin.footer.contact', 'Contact'),
            fields: [
              {
                name: 'phone',
                type: 'text',
                label: a('admin.footer.contact.phone', 'Phone'),
                defaultValue: '+30 210 3388 000',
              },
              {
                name: 'email',
                type: 'email',
                label: a('admin.footer.contact.email', 'Email'),
                defaultValue: 'info@horizonestates.com',
              },
              {
                name: 'addresses',
                type: 'array',
                minRows: 0,
                label: a('admin.footer.contact.addresses', 'Addresses'),
                labels: {
                  singular: a('admin.footer.contact.addressSingular', 'Address'),
                  plural: a('admin.footer.contact.addressesPlural', 'Addresses'),
                },
                admin: {
                  initCollapsed: true,
                  description: a(
                    'admin.footer.contact.addresses.description',
                    'Office locations shown in the footer. Switch locale in the admin bar to edit each language; other locales update via DeepL on save.',
                  ),
                  components: {
                    RowLabel: '@/Footer/AddressRowLabel#AddressRowLabel',
                  },
                },
                fields: [
                  {
                    name: 'address',
                    type: 'textarea',
                    localized: true,
                    required: true,
                    label: a('admin.footer.contact.address', 'Address'),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        label: a('admin.footer.tabs.certifications', 'Certifications'),
        fields: [
          ...sectionLayoutFields({ prefix: 'certifications', defaultOrder: 4 }),
          {
            name: 'certificationsTitle',
            type: 'text',
            localized: true,
            label: a('admin.footer.certificationsTitle', 'Certifications Title'),
            defaultValue: 'CERTIFICATIONS',
          },
          link({
            appearances: false,
            disableLabel: true,
            overrides: {
              name: 'certificationsLink',
              label: a('admin.footer.certificationsLink', 'Certifications page'),
              admin: {
                description: a(
                  'admin.footer.certificationsLink.description',
                  'Page opened when a visitor clicks a certification image (e.g. your Certifications page).',
                ),
              },
            },
          }),
          {
            name: 'certifications',
            type: 'array',
            label: a('admin.footer.certifications', 'Certifications'),
            labels: {
              singular: a('admin.footer.certificationSingular', 'Certification'),
              plural: a('admin.footer.certificationsPlural', 'Certifications'),
            },
            admin: {
              initCollapsed: true,
              description: a(
                'admin.footer.certifications.description',
                'Certification badges in the footer. Removing a row moves it to Globals Trash.',
              ),
              components: {
                RowLabel: '@/Footer/CertificationRowLabel#CertificationRowLabel',
              },
            },
            fields: [
              {
                name: 'image',
                type: 'upload',
                relationTo: 'media',
                label: a('admin.footer.certifications.image', 'Image'),
                admin: {
                  description: a(
                    'admin.footer.certifications.image.description',
                    'Certification badge or logo image shown in the footer. Rows without an image are hidden on the site.',
                  ),
                },
              },
              {
                name: 'label',
                type: 'text',
                label: a('admin.footer.certifications.label', 'Label'),
                admin: {
                  description: a(
                    'admin.footer.certifications.label.description',
                    'Optional name for this certification (admin list + image alt fallback).',
                  ),
                },
              },
            ],
          },
        ],
      },
      {
        label: a('admin.footer.tabs.bottomBar', 'Bottom Bar'),
        fields: [
          ...sectionLayoutFields({
            prefix: 'bottomBar',
            defaultOrder: 5,
            includeLayout: false,
          }),
          {
            name: 'copyrightText',
            type: 'text',
            localized: true,
            label: a('admin.footer.copyrightText', 'Copyright Text'),
            defaultValue: 'ALL RIGHTS RESERVED.',
            admin: {
              description: a(
                'admin.footer.copyrightText.description',
                'Localized “all rights reserved” phrase only. The footer adds ©, year, and app name from Logo → App Name automatically.',
              ),
            },
          },
          {
            name: 'poweredBy',
            type: 'group',
            label: a('admin.footer.poweredBy', 'Powered by'),
            admin: {
              description: a(
                'admin.footer.poweredBy.description',
                'Shown next to the copyright in the bottom bar. The link label opens the URL in a new window. Edit in English; other locales update via DeepL on save.',
              ),
            },
            fields: [
              {
                name: 'text',
                type: 'text',
                localized: true,
                label: a('admin.footer.poweredBy.text', 'Text'),
                defaultValue: 'Powered by',
                admin: {
                  description: a(
                    'admin.footer.poweredBy.text.description',
                    'Text before the link (e.g. Powered by). Leave empty to hide this line.',
                  ),
                },
              },
              {
                name: 'linkLabel',
                type: 'text',
                localized: true,
                label: a('admin.footer.poweredBy.linkLabel', 'Link Label'),
                defaultValue: 'Optima-CRM',
                admin: {
                  description: a(
                    'admin.footer.poweredBy.linkLabel.description',
                    'Hyperlink label (e.g. Optima-CRM).',
                  ),
                },
              },
              {
                name: 'url',
                type: 'text',
                label: a('admin.footer.poweredBy.url', 'URL'),
                defaultValue: 'https://optima-crm.com',
                admin: {
                  description: a(
                    'admin.footer.poweredBy.url.description',
                    'Opens in a new window.',
                  ),
                },
              },
            ],
          },
          {
            name: 'legalLinks',
            type: 'array',
            localized: true,
            label: a('admin.footer.legalLinks', 'Legal Links'),
            labels: {
              singular: a('admin.footer.legalLinkSingular', 'Legal Link'),
              plural: a('admin.footer.legalLinksPlural', 'Legal Links'),
            },
            fields: [
              link({
                appearances: false,
              }),
            ],
            admin: {
              description: a(
                'admin.footer.legalLinks.description',
                'Legal and policy links shown in the bottom bar. Removing a row moves it to Globals Trash.',
              ),
              initCollapsed: true,
              components: {
                RowLabel: '@/Footer/LegalRowLabel#LegalRowLabel',
              },
            },
          },
        ],
      },
    ],
  },
]
