/**
 * Default English copy for the Sell Your Property page seed.
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
  'A targeted sales plan with well-founded price advice',
  'Professional photos and compelling presentations',
  'International exposure through our network and marketing channels',
  'Active matchmaking with serious, qualified buyers',
  'Transparent communication and clear next steps at every stage',
  'Negotiation support until the best possible result',
  'Guidance through paperwork, legal checks, and closing',
  'Local experts with up-to-date market knowledge',
  'Personal service with a single point of contact',
]

const quotes = [
  'They find the right buyer and close the deal.',
  'You know exactly where you stand — every step of the way.',
  'Professional from the first conversation to the keys handover.',
  'They simply get it done.',
  'Strong local knowledge with an international reach.',
  'Clear advice, honest pricing, and real results.',
  'Selling felt easy because they handled everything.',
]

export const sellYourPropertyDefaultContent = {
  eyebrow: 'Sell',
  title: 'Sell your property with Zariko',
  introHeading: 'Thinking about selling?',
  introLead: "Let's talk — with us by your side, your home is as good as sold.",
  highlight: richText(
    paragraph(
      'Zariko is your ',
      text('trusted partner', 1),
      ' for selling your home on the Costa del Sol.',
    ),
  ),
  offersHeading: 'What we offer you:',
  offers: offers.map((text) => ({ text })),
  ctaLabel: 'GET IN TOUCH!',
  whyHeading: 'Why do others choose us?',
  whyLead: 'Our clients say it best:',
  quotes: quotes.map((text) => ({ text })),
  closing: richText(
    paragraph(
      'Discover what our approach can do for you. ',
      text('Your sale is in trusted hands!', 1),
    ),
  ),
}
