/**
 * Default English copy for the Rent Your Property page seed.
 * Uses the same block as Sell Your Property, with rental wording.
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

const offers = [
  'A rental plan with well-founded rent advice',
  'Professional photos and a clear listing presentation',
  'Exposure through our network and marketing channels',
  'Careful matching with suitable, reliable tenants',
  'Viewings arranged and followed up for you',
  'Transparent communication at every stage',
  'Help with the tenancy agreement and handover',
  'Local experts with up-to-date rental market knowledge',
  'Personal service with a single point of contact',
]

const quotes = [
  'They found the right tenant and handled the paperwork.',
  'You know exactly where you stand — every step of the way.',
  'Professional from the first conversation to the key handover.',
  'They simply get it done.',
  'Strong local knowledge with an international reach.',
  'Clear advice, honest pricing, and a smooth letting.',
  'Renting out the property felt easy because they handled everything.',
]

export const rentYourPropertyDefaultContent = {
  focus: 'rent' as const,
  eyebrow: 'Rent',
  title: 'Rent your property with Zariko',
  introHeading: 'Thinking about renting out your property?',
  introLead: "Let's talk — with us by your side, your home is in trusted hands.",
  highlight: richText(
    paragraph(
      'Zariko is your ',
      text('trusted partner', 1),
      ' for renting your home on the Costa del Sol.',
    ),
  ),
  offersHeading: 'What we offer you:',
  offers: offers.map((item) => ({ text: item })),
  ctaLabel: 'GET IN TOUCH!',
  whyHeading: 'Why do others choose us?',
  whyLead: 'Our clients say it best:',
  quotes: quotes.map((item) => ({ text: item })),
  closing: richText(
    paragraph(
      'Discover what our approach can do for you. ',
      text('Your rental is in trusted hands!', 1),
    ),
  ),
}
