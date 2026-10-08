import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const WelcomeBlock: Block = {
  slug: 'welcomeBlock',
  interfaceName: 'WelcomeBlock',
  labels: {
    singular: a('admin.blocks.welcomeBlock.singular', 'Welcome Section'),
    plural: a('admin.blocks.welcomeBlock.plural', 'Welcome Sections'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.welcomeBlock.titleLabel', 'Title'),
      admin: {
        description: a(
          'admin.blocks.welcomeBlock.titleDescription',
          'Large heading on the left (e.g. Welcome to Zariko). Edit in English only — other languages refresh via DeepL on save.',
        ),
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      label: a('admin.blocks.welcomeBlock.descriptionLabel', 'Description'),
      admin: {
        description: a(
          'admin.blocks.welcomeBlock.descriptionDescription',
          'Supporting copy shown to the right of the title.',
        ),
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
      label: a('admin.blocks.welcomeBlock.buttonTextLabel', 'Button Text'),
      admin: {
        description: a(
          'admin.blocks.welcomeBlock.buttonTextDescription',
          'CTA label under the description (e.g. Please click around!). Leave empty to hide the button.',
        ),
      },
    },
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.welcomeBlock.ctaLinkLabel', 'Button Link'),
        admin: {
          description: a(
            'admin.blocks.welcomeBlock.ctaLinkDescription',
            'Where the welcome CTA navigates. Only used when Button Text is set.',
          ),
          condition: (_: unknown, siblingData: { buttonText?: string | null }) =>
            Boolean(siblingData?.buttonText?.trim()),
        },
      },
    }),
  ],
}
