import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const AboutUsHeroBlock: Block = {
  slug: 'aboutUsHeroBlock',
  interfaceName: 'AboutUsHeroBlock',
  labels: {
    singular: a('admin.blocks.aboutUsHeroBlock.singular', 'About Us Hero'),
    plural: a('admin.blocks.aboutUsHeroBlock.plural', 'About Us Hero Sections'),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      defaultValue: 'About Us',
      label: a('admin.blocks.aboutUsHeroBlock.labelLabel', 'Label'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.labelDescription',
          'Small label above the headline',
        ),
      },
    },
    {
      name: 'headline',
      type: 'textarea',
      required: true,
      defaultValue: "We don't just sell properties. We help you find home.",
      localized: true,
      label: a('admin.blocks.aboutUsHeroBlock.headlineLabel', 'Headline'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.headlineDescription',
          'Large serif headline. The phrase “find home” is styled in gold italic automatically.',
        ),
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      defaultValue:
        'A full-service real estate company dedicated to helping clients confidently find, buy, sell, and invest in exceptional properties.',
      label: a('admin.blocks.aboutUsHeroBlock.descriptionLabel', 'Description'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.descriptionDescription',
          'Supporting paragraph below the headline',
        ),
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
      defaultValue: 'Explore Properties',
      label: a('admin.blocks.aboutUsHeroBlock.buttonTextLabel', 'Button Text'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.buttonTextDescription',
          'Hero CTA label. Leave empty to hide the button.',
        ),
      },
    },
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.aboutUsHeroBlock.ctaLinkLabel', 'Button Link'),
        admin: {
          description: a(
            'admin.blocks.aboutUsHeroBlock.ctaLinkDescription',
            'Where the hero button navigates. Only used when Button Text is set.',
          ),
          condition: (_: unknown, siblingData: { buttonText?: string | null }) =>
            Boolean(siblingData?.buttonText?.trim()),
        },
      },
    }),
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.aboutUsHeroBlock.backgroundImageLabel', 'Background Image'),
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.backgroundImageDescription',
          'Full-width background photograph',
        ),
      },
    },
    {
      name: 'stats',
      type: 'array',
      maxRows: 4,
      label: a('admin.blocks.aboutUsHeroBlock.statsLabel', 'Stats Bar'),
      labels: {
        singular: a('admin.blocks.aboutUsHeroBlock.statSingular', 'Stat'),
        plural: a('admin.blocks.aboutUsHeroBlock.statsPlural', 'Stats'),
      },
      defaultValue: [
        { value: '1999', label: 'Established', icon: 'calendar' },
        { value: '500+', label: 'Happy Clients', icon: 'users' },
        { value: '20+', label: 'Years Experience', icon: 'clock' },
      ],
      admin: {
        description: a(
          'admin.blocks.aboutUsHeroBlock.statsDescription',
          'Shown as a floating bar at the bottom of the hero. Leave empty to hide.',
        ),
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.aboutUsHeroBlock.statValueLabel', 'Value'),
          admin: {
            description: a(
              'admin.blocks.aboutUsHeroBlock.statValueDescription',
              'e.g. 1999, 500+, 20+',
            ),
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.aboutUsHeroBlock.statLabelLabel', 'Label'),
          admin: {
            placeholder: a(
              'admin.blocks.aboutUsHeroBlock.statLabelPlaceholder',
              'e.g. Established',
            ),
          },
        },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'award',
          label: a('admin.blocks.aboutUsHeroBlock.statIconLabel', 'Icon'),
          options: [
            { label: a('admin.blocks.aboutUsHeroBlock.iconCalendar', 'Calendar'), value: 'calendar' },
            { label: a('admin.blocks.aboutUsHeroBlock.iconUsers', 'Users'), value: 'users' },
            { label: a('admin.blocks.aboutUsHeroBlock.iconAward', 'Award'), value: 'award' },
            { label: a('admin.blocks.aboutUsHeroBlock.iconClock', 'Clock'), value: 'clock' },
            { label: a('admin.blocks.aboutUsHeroBlock.iconHome', 'Home'), value: 'home' },
          ],
        },
      ],
    },
  ],
}
