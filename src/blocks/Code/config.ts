import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  labels: {
    singular: a('admin.blocks.code.singular', 'Code Block'),
    plural: a('admin.blocks.code.plural', 'Code Blocks'),
  },
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      label: a('admin.blocks.code.languageLabel', 'Language'),
      options: [
        {
          label: a('admin.blocks.code.languageTypescript', 'Typescript'),
          value: 'typescript',
        },
        {
          label: a('admin.blocks.code.languageJavascript', 'Javascript'),
          value: 'javascript',
        },
        {
          label: a('admin.blocks.code.languageCss', 'CSS'),
          value: 'css',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}
