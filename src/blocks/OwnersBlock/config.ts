import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const OwnersBlock: Block = {
  slug: 'ownersBlock',
  dbName: 'own_blk',
  interfaceName: 'OwnersBlock',
  labels: {
    singular: a('admin.blocks.ownersBlock.singular', 'Owners'),
    plural: a('admin.blocks.ownersBlock.plural', 'Owners'),
  },
  fields: [
    {
      name: 'formEyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'For Owners',
      label: a('admin.blocks.ownersBlock.formEyebrowLabel', 'Form Eyebrow'),
    },
    {
      name: 'formTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'List Your Property with Zariko',
      label: a('admin.blocks.ownersBlock.formTitleLabel', 'Form Title'),
    },
    {
      name: 'formDescription',
      type: 'textarea',
      localized: true,
      defaultValue:
        "Whether you want to rent or sell your property, we'll help you get the best exposure and connect you with the right buyers or tenants. Our team provides expert guidance and full support throughout the process.",
      label: a('admin.blocks.ownersBlock.formDescriptionLabel', 'Form Description'),
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Create owner',
      label: a('admin.blocks.ownersBlock.ctaLabel', 'Button label'),
      admin: {
        description: a(
          'admin.blocks.ownersBlock.ctaLabelDescription',
          'Opens the owner form. Shown on the homepage card.',
        ),
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: a('admin.blocks.ownersBlock.imageLabel', 'Image'),
      admin: {
        description: a(
          'admin.blocks.ownersBlock.imageDescription',
          'Photo on the right of the homepage card.',
        ),
      },
    },
    {
      name: 'submitLabelOverride',
      type: 'text',
      localized: true,
      label: a('admin.blocks.ownersBlock.submitLabelOverrideLabel', 'Submit Label Override'),
      admin: {
        description: a(
          'admin.blocks.ownersBlock.submitLabelOverrideDescription',
          'Optional. If empty, the submit label from the selected form is used.',
        ),
      },
    },
    {
      name: 'formTrustNote',
      type: 'text',
      localized: true,
      defaultValue: "Your information is safe with us. We'll never share your details.",
      label: a('admin.blocks.ownersBlock.formTrustNoteLabel', 'Form Trust Note'),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'enableResubmit',
          type: 'checkbox',
          label: a(
            'admin.blocks.ownersBlock.enableResubmitLabel',
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
          label: a('admin.blocks.ownersBlock.resubmitButtonLabelLabel', 'Resubmit Button Label'),
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
          label: a('admin.blocks.ownersBlock.successTitleLabel', 'Success Title'),
          admin: {
            width: '50%',
          },
        },
        {
          name: 'successSubtitle',
          type: 'text',
          localized: true,
          defaultValue: 'Your response has been submitted.',
          label: a('admin.blocks.ownersBlock.successSubtitleLabel', 'Success Subtitle'),
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      label: a('admin.blocks.ownersBlock.formLabel', 'Form'),
      admin: {
        description: a(
          'admin.blocks.ownersBlock.formDescription',
          'Use the Contact form so owners see the same fields as Contact Us.',
        ),
      },
    },
  ],
}
