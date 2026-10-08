/**
 * Lexical helpers + default English Buying Guide copy (from reference timeline).
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

type LexicalListItem = {
  type: 'listitem'
  children: Array<LexicalText | LexicalList>
  direction: 'ltr'
  format: ''
  indent: number
  value: number
  version: 1
}

type LexicalList = {
  type: 'list'
  listType: 'bullet'
  tag: 'ul'
  start: 1
  direction: 'ltr'
  format: ''
  indent: 0
  version: 1
  children: LexicalListItem[]
}

type LexicalRoot = {
  root: {
    type: 'root'
    children: Array<LexicalParagraph | LexicalList>
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

function bulletList(items: string[]): LexicalList {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: items.map((item, index) => ({
      type: 'listitem',
      children: [text(item)],
      direction: 'ltr',
      format: '',
      indent: 0,
      value: index + 1,
      version: 1,
    })),
  }
}

function richText(...nodes: Array<LexicalParagraph | LexicalList>): LexicalRoot {
  return {
    root: {
      type: 'root',
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const bold = (value: string) => text(value, 1)

export const buyingGuideDefaultContent = {
  eyebrow: 'Help & advice',
  title: 'Buying guide in Spain: Zariko Plan',
  lead: 'A clear path from first conversation to keys in hand — budget, locations, process, taxes, and more.',
  steps: [
    {
      title: 'The start',
      body: richText(
        paragraph(
          'Buying a house in Spain is an important decision — whether you want a holiday home, a property with rental potential, or a place to move permanently. Start by setting clear personal goals: how often you will use the home, whether you want rental income, and how long you plan to keep it.',
        ),
        paragraph(
          'During the process, we look beyond the house itself and consider the bigger picture, such as:',
        ),
        bulletList([
          'The purchase process step by step',
          'Financing options',
          'Local rental regulations, like the tourist license required in Andalusia',
          'Tax rules in both your home country and Spain',
          'Legal considerations, especially when emigrating',
        ]),
        paragraph(
          'With the right preparation and guidance, buying in Spain can be a smooth and successful journey.',
        ),
      ),
    },
    {
      title: 'Budget and purchase costs',
      body: richText(
        paragraph(bold('Determining your budget')),
        paragraph(
          'Your budget shapes the property type, location, and how competitively you can bid. Include not only the purchase price, but also reserves for taxes, fees, furnishings, and the first year of ownership.',
        ),
        paragraph(bold('Purchase costs')),
        paragraph(
          'Plan for approximately 10–14% in additional buying costs on top of the purchase price. These typically include:',
        ),
        bulletList([
          'Transfer tax (resale) or VAT + stamp duty (new-build)',
          'Notary and land registry fees',
          'Lawyer / gestoría fees',
          'Mortgage costs if you finance (valuation, arrangement fees)',
          'Possible community fee arrears or outstanding utilities (checked during due diligence)',
        ]),
        paragraph(
          'A local mortgage advisor can compare bank offers for non-residents and help you understand the true monthly cost.',
        ),
      ),
    },
    {
      title: 'Property types and locations',
      body: richText(
        paragraph(bold('Types of real estate & property styles')),
        paragraph(
          'Spain offers a wide range — apartments, townhouses, villas, and new developments. New-builds often bring modern finishes and warranties; resale properties can offer established communities and more room to negotiate.',
        ),
        paragraph(
          'Location matters as much as the property: beachside living, golf communities, town centres, or quieter inland villages each bring different lifestyle, rental potential, and running costs. We help you match area and property type to how you will actually use the home.',
        ),
      ),
    },
    {
      title: 'Search yourself or contact a real estate agent',
      body: richText(
        paragraph(bold('Searching by yourself')),
        paragraph(
          'Online portals are useful for inspiration, but listings can be incomplete, outdated, or duplicated. Without local insight it is easy to miss planning issues, community costs, or true market value.',
        ),
        paragraph(bold('Working with a local agent')),
        paragraph(
          'A trusted local agency shortlists properties that fit your brief, arranges viewings, negotiates on your behalf, and introduces lawyers, mortgage brokers, and other specialists. You gain a single point of contact who understands both the market and the paperwork.',
        ),
      ),
    },
    {
      title: 'The buying process and the most important steps',
      body: richText(
        paragraph(bold('The buying process')),
        bulletList([
          'Reservation — secure the property with a reservation contract and deposit.',
          'Preliminary contract — private purchase contract, typically with around 10% deposit.',
          'Financing — arrange your mortgage early to avoid surprises at completion.',
          'Notary & transfer — sign the official deed (Escritura) before a Spanish notary.',
          'Taxes and fees — pay transfer tax / VAT and registration fees after the transfer.',
        ]),
        paragraph(bold('What to watch out for')),
        paragraph(
          'Always check title documents, community fees, outstanding debts, licences, and planning status before you commit. Independent due diligence protects your investment.',
        ),
        paragraph(bold('Lawyer and notary')),
        paragraph(
          'Instruct your own lawyer for legal checks. The notary authenticates the deed but does not replace independent advice. Legal and notary-related costs are commonly around 1–2% combined, depending on the deal.',
        ),
      ),
    },
    {
      title: 'Renting out your home? Tips & rules',
      body: richText(
        paragraph(bold('How the process works')),
        paragraph(
          'If you plan to rent — short-term tourist stays or longer lets — understand local licensing rules before you buy. In Andalusia and many coastal areas, tourist licences and community bylaws can limit or regulate short-term rentals.',
        ),
        paragraph(bold('Taxes on renting')),
        paragraph(
          'Rental income is taxable in Spain. Non-residents usually face specific withholding and filing rules. Factor agency fees, cleaning, maintenance, and empty periods into your net yield.',
        ),
      ),
    },
    {
      title: 'Costs for the owner',
      body: richText(
        paragraph(bold('Costs and taxes in Spain')),
        paragraph(
          'Ownership brings annual costs beyond the purchase. Typical items include IBI (local property tax), community fees, utilities, insurance, and — for non-residents — income tax on imputed or rental income.',
        ),
        paragraph(
          'We can estimate running costs for properties you are considering so your yearly budget stays realistic.',
        ),
      ),
    },
    {
      title: 'Taxes in Spain',
      body: richText(
        paragraph(
          'Spanish property involves purchase taxes (transfer tax or VAT + stamp duty), annual ownership taxes, and capital gains tax when you sell. Rules differ for residents and non-residents, and your home-country tax position may also apply.',
        ),
        paragraph(
          'Always confirm current rates and filing obligations with a Spanish tax advisor — especially if you hold property through a company or plan to relocate.',
        ),
      ),
    },
    {
      title: 'Inheritance and donation of property in Spain',
      body: richText(
        paragraph(
          'Passing on Spanish property involves declaring heirs, paying inheritance or gift tax where due, and completing notarial formalities. Estate planning — a Spanish will, lifetime gifts, or structuring ownership — can make the process clearer for your family.',
        ),
        paragraph(
          'Cross-border inheritance touches both Spanish and home-country law. Speak with a specialist so your wills and tax planning work together.',
        ),
      ),
    },
    {
      title: 'Key points',
      body: richText(
        paragraph(bold('Purchase process — keep these in focus')),
        bulletList([
          'Determine budget and financing, including additional buying costs.',
          'Choose location and property type that match your lifestyle and goals.',
          'Work with a real estate agent and a trusted team of local experts.',
          'Use independent legal advice before signing any binding contract.',
          'Plan for ownership costs, taxes, and — if relevant — rental rules from day one.',
        ]),
      ),
    },
  ],
  closingHeading: 'Successful buying in Spain — request our free comprehensive guide',
  closingBody: richText(
    paragraph(
      'Buying property in Spain is an exciting step, whether you are looking for a holiday home, a rental investment, or a permanent residence. With the right preparation and guidance, the process can be smooth and successful.',
    ),
    paragraph(
      'At Zariko, we support you every step of the way — from house hunting to handing over the keys. Feel free to contact us if you have any questions or need assistance.',
    ),
    paragraph(
      bold('Good to know: '),
      "We've also created a more comprehensive guide that dives deeper into the buying process, taxes, legal matters, and rental options. If you're interested, you can request this free guide below.",
    ),
  ),
}
