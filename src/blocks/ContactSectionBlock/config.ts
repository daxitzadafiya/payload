import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const ContactSectionBlock: Block = {
  slug: 'contactSectionBlock',
  interfaceName: 'ContactSectionBlock',
  labels: {
    singular: a('admin.blocks.contactSectionBlock.singular', 'Contact Section'),
    plural: a('admin.blocks.contactSectionBlock.plural', 'Contact Sections'),
  },
  fields: [
    {
      name: 'layoutStyle',
      type: 'select',
      defaultValue: 'editorial',
      label: a('admin.blocks.contactSectionBlock.layoutStyleLabel', 'Layout style'),
      options: [
        {
          label: a(
            'admin.blocks.contactSectionBlock.layoutStyleEditorial',
            'Editorial (offices + form panel)',
          ),
          value: 'editorial',
        },
        {
          label: a(
            'admin.blocks.contactSectionBlock.layoutStyleInquiryBanner',
            'Inquiry banner (form only, dark bar)',
          ),
          value: 'inquiryBanner',
        },
      ],
      admin: {
        description: a(
          'admin.blocks.contactSectionBlock.layoutStyleDescription',
          'Use Inquiry banner on Buying Guide and similar pages — no office cards.',
        ),
      },
    },
    {
      name: 'formEyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Inquiry',
      label: a('admin.blocks.contactSectionBlock.formEyebrowLabel', 'Form Eyebrow'),
      admin: {
        description: a(
          'admin.blocks.contactSectionBlock.formEyebrowDescription',
          'Small uppercase label above the form title (left side).',
        ),
      },
    },
    {
      name: 'formTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Private Consultation',
      label: a('admin.blocks.contactSectionBlock.formTitleLabel', 'Form Title'),
    },
    {
      name: 'formDescription',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Our specialists are dedicated to finding your ideal heritage property. Please share your requirements below.',
      label: a('admin.blocks.contactSectionBlock.formDescriptionLabel', 'Form Description'),
    },
    {
      name: 'formPhone',
      type: 'text',
      localized: true,
      label: a('admin.blocks.contactSectionBlock.formPhoneLabel', 'Call-us phone'),
      admin: {
        description: a(
          'admin.blocks.contactSectionBlock.formPhoneDescription',
          'Optional. Shown under the description on Inquiry banner layout (e.g. +34 603 529 900).',
        ),
        condition: (_, siblingData) => siblingData?.layoutStyle === 'inquiryBanner',
      },
    },
    {
      name: 'submitLabelOverride',
      type: 'text',
      localized: true,
      label: a('admin.blocks.contactSectionBlock.submitLabelOverrideLabel', 'Submit Label Override'),
      admin: {
        description: a(
          'admin.blocks.contactSectionBlock.submitLabelOverrideDescription',
          'Optional. If empty, submit label from the selected form is used.',
        ),
      },
    },
    {
      name: 'formTrustNote',
      type: 'text',
      localized: true,
      defaultValue: "Your information is safe with us. We'll never share your details.",
      label: a('admin.blocks.contactSectionBlock.formTrustNoteLabel', 'Form Trust Note'),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'enableResubmit',
          type: 'checkbox',
          label: a(
            'admin.blocks.contactSectionBlock.enableResubmitLabel',
            'Enable re-submit button after success',
          ),
          defaultValue: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'resubmitButtonLabel',
          type: 'text',
          localized: true,
          defaultValue: 'Submit another response',
          label: a(
            'admin.blocks.contactSectionBlock.resubmitButtonLabelLabel',
            'Resubmit Button Label',
          ),
          admin: {
            width: '50%',
            condition: (_, siblingData) => Boolean(siblingData?.enableResubmit),
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'successTitle',
          type: 'text',
          localized: true,
          defaultValue: 'Thank you!',
          label: a('admin.blocks.contactSectionBlock.successTitleLabel', 'Success Title'),
          admin: {
            width: '50%',
            description: a(
              'admin.blocks.contactSectionBlock.successTitleDescription',
              'Heading shown after successful form submission.',
            ),
          },
        },
        {
          name: 'successSubtitle',
          type: 'text',
          localized: true,
          defaultValue: 'Your response has been submitted.',
          label: a('admin.blocks.contactSectionBlock.successSubtitleLabel', 'Success Subtitle'),
          admin: {
            width: '50%',
            description: a(
              'admin.blocks.contactSectionBlock.successSubtitleDescription',
              'Subtext shown below the success title.',
            ),
          },
        },
      ],
    },
    {
      name: 'offices',
      type: 'array',
      minRows: 0,
      label: a('admin.blocks.contactSectionBlock.officesLabel', 'Offices'),
      labels: {
        singular: a('admin.blocks.contactSectionBlock.officeSingular', 'Office'),
        plural: a('admin.blocks.contactSectionBlock.officesPlural', 'Offices'),
      },
      admin: {
        initCollapsed: true,
        condition: (_, siblingData) => siblingData?.layoutStyle !== 'inquiryBanner',
        description: a(
          'admin.blocks.contactSectionBlock.officesDescription',
          'Optional office cards. Hidden when Layout style is Inquiry banner.',
        ),
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          defaultValue: 'Headquarters',
          label: a('admin.blocks.contactSectionBlock.officeLabelLabel', 'Label'),
        },
        {
          name: 'city',
          type: 'text',
          required: true,
          localized: true,
          defaultValue: 'Athens',
          label: a('admin.blocks.contactSectionBlock.cityLabel', 'City'),
        },
        {
          name: 'addressLines',
          type: 'array',
          minRows: 1,
          label: a('admin.blocks.contactSectionBlock.addressLinesLabel', 'Address Lines'),
          labels: {
            singular: a('admin.blocks.contactSectionBlock.addressLineSingular', 'Address Line'),
            plural: a('admin.blocks.contactSectionBlock.addressLinesPlural', 'Address Lines'),
          },
          fields: [
            {
              name: 'line',
              type: 'text',
              required: true,
              localized: true,
              label: a('admin.blocks.contactSectionBlock.addressLineLabel', 'Line'),
            },
          ],
        },
        {
          name: 'phone',
          type: 'text',
          label: a('admin.blocks.contactSectionBlock.phoneLabel', 'Phone'),
        },
        {
          name: 'email',
          type: 'email',
          label: a('admin.blocks.contactSectionBlock.emailLabel', 'Email'),
        },
        {
          type: 'row',
          fields: [
            {
              name: 'lat',
              type: 'number',
              label: a('admin.blocks.contactSectionBlock.latLabel', 'Latitude'),
              admin: {
                width: '50%',
                description: a(
                  'admin.blocks.contactSectionBlock.latDescription',
                  'Latitude for map marker (e.g. 48.9903224).',
                ),
                step: 0.000001,
              },
            },
            {
              name: 'lon',
              type: 'number',
              label: a('admin.blocks.contactSectionBlock.lonLabel', 'Longitude'),
              admin: {
                width: '50%',
                description: a(
                  'admin.blocks.contactSectionBlock.lonDescription',
                  'Longitude for map marker (e.g. 12.1991392).',
                ),
                step: 0.000001,
              },
            },
          ],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: a('admin.blocks.contactSectionBlock.imageLabel', 'Image'),
        },
      ],
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      label: a('admin.blocks.contactSectionBlock.formLabel', 'Form'),
      admin: {
        description: a(
          'admin.blocks.contactSectionBlock.formDescription',
          'Select a form from the Forms collection. Manage fields and submissions under Forms / Form Submissions in admin.',
        ),
      },
    },
  ],
}
