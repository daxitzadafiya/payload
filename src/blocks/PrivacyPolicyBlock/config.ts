import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

const richTextField = (name: string, labelKey: string, labelFallback: string): Field => ({
  name,
  type: 'richText',
  localized: true,
  label: a(labelKey, labelFallback),
  editor: lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  }),
})

export const PrivacyPolicyBlock: Block = {
  slug: 'privacyPolicyBlock',
  dbName: 'pp',
  interfaceName: 'PrivacyPolicyBlock',
  labels: {
    singular: a('admin.blocks.privacyPolicyBlock.singular', 'Privacy Policy Layout'),
    plural: a('admin.blocks.privacyPolicyBlock.plural', 'Privacy Policy Layouts'),
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Legal Integrity',
      label: a('admin.blocks.privacyPolicyBlock.eyebrowLabel', 'Eyebrow'),
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Privacy Policy',
      label: a('admin.blocks.privacyPolicyBlock.titleLabel', 'Title'),
    },
    {
      name: 'introText',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Last updated: May 24, 2026. This policy outlines our commitment to protecting your digital footprint with the same discretion we apply to our physical estates.',
      label: a('admin.blocks.privacyPolicyBlock.introTextLabel', 'Intro Text'),
    },
    {
      name: 'tocTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Table of Contents',
      label: a('admin.blocks.privacyPolicyBlock.tocTitleLabel', 'Table of Contents Title'),
    },
    {
      name: 'sections',
      type: 'array',
      dbName: 'secs',
      minRows: 1,
      label: a('admin.blocks.privacyPolicyBlock.sectionsLabel', 'Sections'),
      labels: {
        singular: a('admin.blocks.privacyPolicyBlock.sectionSingular', 'Section'),
        plural: a('admin.blocks.privacyPolicyBlock.sectionsPlural', 'Sections'),
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'anchorId',
          type: 'text',
          required: true,
          label: a('admin.blocks.privacyPolicyBlock.anchorIdLabel', 'Anchor ID'),
          admin: {
            description: a(
              'admin.blocks.privacyPolicyBlock.anchorIdDescription',
              'Used for in-page navigation anchor (e.g. introduction, data-collection).',
            ),
          },
        },
        {
          name: 'tocLabel',
          type: 'text',
          localized: true,
          required: true,
          defaultValue: '01. Introduction',
          label: a('admin.blocks.privacyPolicyBlock.tocLabelLabel', 'TOC Label'),
        },
        {
          name: 'heading',
          type: 'text',
          localized: true,
          required: true,
          defaultValue: '01. Introduction',
          label: a('admin.blocks.privacyPolicyBlock.headingLabel', 'Heading'),
        },
        richTextField('body', 'admin.blocks.privacyPolicyBlock.bodyLabel', 'Body content'),
        {
          name: 'highlightQuote',
          type: 'textarea',
          localized: true,
          label: a('admin.blocks.privacyPolicyBlock.highlightQuoteLabel', 'Highlight Quote'),
          admin: {
            description: a(
              'admin.blocks.privacyPolicyBlock.highlightQuoteDescription',
              'Optional highlighted quote panel.',
            ),
          },
        },
        {
          name: 'featureCards',
          type: 'array',
          label: a('admin.blocks.privacyPolicyBlock.featureCardsLabel', 'Feature Cards'),
          labels: {
            singular: a('admin.blocks.privacyPolicyBlock.featureCardSingular', 'Feature Card'),
            plural: a('admin.blocks.privacyPolicyBlock.featureCardsPlural', 'Feature Cards'),
          },
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              name: 'icon',
              type: 'text',
              required: true,
              defaultValue: 'person',
              label: a('admin.blocks.privacyPolicyBlock.featureCardIconLabel', 'Icon'),
            },
            {
              name: 'title',
              type: 'text',
              localized: true,
              required: true,
              label: a('admin.blocks.privacyPolicyBlock.featureCardTitleLabel', 'Title'),
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              required: true,
              label: a('admin.blocks.privacyPolicyBlock.featureCardDescriptionLabel', 'Description'),
            },
          ],
        },
        {
          name: 'bulletItems',
          type: 'array',
          label: a('admin.blocks.privacyPolicyBlock.bulletItemsLabel', 'Bullet Items'),
          labels: {
            singular: a('admin.blocks.privacyPolicyBlock.bulletItemSingular', 'Bullet Item'),
            plural: a('admin.blocks.privacyPolicyBlock.bulletItemsPlural', 'Bullet Items'),
          },
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              name: 'icon',
              type: 'text',
              defaultValue: 'check_circle',
              label: a('admin.blocks.privacyPolicyBlock.bulletItemIconLabel', 'Icon'),
            },
            {
              name: 'text',
              type: 'textarea',
              localized: true,
              required: true,
              label: a('admin.blocks.privacyPolicyBlock.bulletItemTextLabel', 'Text'),
            },
          ],
        },
        {
          name: 'visualPanel',
          type: 'group',
          label: a('admin.blocks.privacyPolicyBlock.visualPanelLabel', 'Visual Panel'),
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: a('admin.blocks.privacyPolicyBlock.visualPanelImageLabel', 'Image'),
            },
            {
              name: 'icon',
              type: 'text',
              defaultValue: 'lock',
              label: a('admin.blocks.privacyPolicyBlock.visualPanelIconLabel', 'Icon'),
            },
            {
              name: 'title',
              type: 'text',
              localized: true,
              defaultValue: 'Encrypted Protocols',
              label: a('admin.blocks.privacyPolicyBlock.visualPanelTitleLabel', 'Title'),
            },
          ],
        },
        {
          name: 'contactPanel',
          type: 'group',
          label: a('admin.blocks.privacyPolicyBlock.contactPanelLabel', 'Contact Panel'),
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              label: a('admin.blocks.privacyPolicyBlock.contactPanelTitleLabel', 'Title'),
            },
            {
              name: 'email',
              type: 'email',
              label: a('admin.blocks.privacyPolicyBlock.contactPanelEmailLabel', 'Email'),
            },
            {
              name: 'buttonLabel',
              type: 'text',
              localized: true,
              label: a('admin.blocks.privacyPolicyBlock.buttonLabelLabel', 'Button Label'),
              admin: {
                description: a(
                  'admin.blocks.privacyPolicyBlock.buttonLabelDescription',
                  'Text shown on the button.',
                ),
              },
            },
            link({
              appearances: false,
              disableLabel: true,
              overrides: {
                name: 'buttonLink',
                dbName: 'blink',
                label: a('admin.blocks.privacyPolicyBlock.buttonLinkLabel', 'Button action'),
                admin: {
                  description: a(
                    'admin.blocks.privacyPolicyBlock.buttonLinkDescription',
                    'Internal page or custom URL. If empty, the button uses a mailto link to the email above.',
                  ),
                },
              },
            }),
          ],
        },
        {
          name: 'showDividerBefore',
          type: 'checkbox',
          defaultValue: false,
          label: a('admin.blocks.privacyPolicyBlock.showDividerBeforeLabel', 'Show Divider Before'),
        },
      ],
    },
  ],
}
