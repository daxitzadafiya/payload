/**
 * Default English copy for the Charity page seed.
 */

type LexicalText = {
  type: 'text'
  detail: 0
  format: number
  mode: 'normal'
  style: ''
  text: string
  version: 1
}

type LexicalParagraph = {
  type: 'paragraph'
  children: LexicalText[]
  direction: 'ltr'
  format: ''
  indent: 0
  textFormat: 0
  version: 1
}

type LexicalRoot = {
  root: {
    type: 'root'
    children: LexicalParagraph[]
    direction: 'ltr'
    format: ''
    indent: 0
    version: 1
  }
}

function text(value: string, format = 0): LexicalText {
  return {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text: value,
    version: 1,
  }
}

function paragraph(...parts: Array<string | LexicalText>): LexicalParagraph {
  const children = parts.map((part) => (typeof part === 'string' ? text(part) : part))
  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

function richText(...paragraphs: LexicalParagraph[]): LexicalRoot {
  return {
    root: {
      type: 'root',
      children: paragraphs,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export const charityDefaultContent = {
  eyebrow: 'About us',
  title: 'Charity',
  subtitle: 'Together for a Better World — Zariko & Triple A Marbella',
  body: richText(
    paragraph(
      'At Zariko, we believe that success is most meaningful when it is shared. That is why we proudly support Triple A Marbella, a non-profit animal shelter dedicated to rescuing, caring for, and rehoming abandoned animals on the Costa del Sol.',
    ),
    paragraph(
      'From every property sale, we donate a fixed amount to Triple A Marbella. This contribution helps provide food, medical care, shelter, and a second chance for animals in need — turning each closing into a moment of positive impact beyond real estate.',
    ),
    paragraph(
      'Together with our clients and partners, we are building more than beautiful homes. We are helping create a kinder community where compassion and responsibility go hand in hand. Thank you for being part of this journey.',
    ),
  ),
  // Set the live Triple A Marbella YouTube/Vimeo URL in admin.
  videoUrl: '',
  videoCaption: 'Refugio Triple A Marbella',
}
