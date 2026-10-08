/**
 * Default English copy for the After Sales Care page seed.
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

const serviceItems = [
  'Advice and support for property maintenance',
  'Assistance finding reliable local professionals and service providers',
  'Guidance with administrative and legal questions',
  'Regular updates on the local market and developments',
  'Support with rental or resale when desired',
  'Personal contact and quick response to all your inquiries',
]

export const afterSalesCareDefaultContent = {
  eyebrow: 'Help & Advice',
  title: 'After Sales Care by Zariko',
  lead: 'After your purchase you can also count on Zariko!',
  sectionHeading: 'After Sales by Zariko',
  intro: richText(
    paragraph(
      'At Zariko, our service doesn\u2019t stop once the purchase is complete. We remain your dedicated partner long after you receive the keys, helping you settle in with confidence and enjoy your property to the fullest.',
    ),
    paragraph(
      'We believe in a personal and dedicated approach. Whether you need practical advice, trusted local contacts, or guidance on the next steps for your home, our team is here for you.',
    ),
  ),
  servicesHeading: 'Our after sales services include:',
  services: serviceItems.map((text) => ({ text })),
}
