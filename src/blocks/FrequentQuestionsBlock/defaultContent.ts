/**
 * Lexical helpers + default English FAQ copy for the Frequent Questions page seed.
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
  children: Array<LexicalText | LexicalParagraph | LexicalList>
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

function bulletList(items: Array<string | { label: string; children?: string[] }>): LexicalList {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: items.map((item, index) => {
      if (typeof item === 'string') {
        return {
          type: 'listitem',
          children: [text(item)],
          direction: 'ltr',
          format: '',
          indent: 0,
          value: index + 1,
          version: 1,
        }
      }

      const nested: LexicalListItem['children'] = [text(item.label)]
      if (item.children?.length) {
        nested.push({
          type: 'list',
          listType: 'bullet',
          tag: 'ul',
          start: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
          children: item.children.map((child, childIndex) => ({
            type: 'listitem',
            children: [text(child)],
            direction: 'ltr',
            format: '',
            indent: 1,
            value: childIndex + 1,
            version: 1,
          })),
        })
      }

      return {
        type: 'listitem',
        children: nested,
        direction: 'ltr',
        format: '',
        indent: 0,
        value: index + 1,
        version: 1,
      }
    }),
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

export const frequentQuestionsDefaultContent = {
  eyebrow: 'Buying guide',
  title: 'Frequent questions',
  lead: 'You are in a position to realise your dream of having a place in the sun...',
  introHeading: 'Buying a Property in Spain: Frequently Asked Questions',
  intro: richText(
    paragraph(
      'Buying a property in Spain is an exciting journey — whether you are looking for a holiday home, a permanent residence, or an investment. Understanding the process, costs, and legal requirements helps you move forward with confidence.',
    ),
    paragraph(
      'Below you will find clear answers to the questions we hear most often from international buyers. Our team is happy to guide you through every step, from first viewing to keys in hand.',
    ),
    paragraph(
      'If your situation is more specific, contact us and we will connect you with the right local specialists.',
    ),
  ),
  items: [
    {
      question: 'I know where I want to buy — what is the buying process?',
      answer: richText(
        paragraph(
          'Once you have chosen a property, the typical path is: make an offer, sign a reservation or private purchase contract (with a deposit), complete due diligence with your lawyer, arrange financing if needed, then complete the purchase before a Spanish notary and register the deed.',
        ),
        paragraph(
          'Timelines vary by property type and financing, but most cash purchases complete within a few weeks once contracts are agreed. We coordinate viewings, negotiation, and introductions to trusted lawyers and mortgage brokers throughout.',
        ),
      ),
    },
    {
      question: 'Should I buy a new-build or a resale property?',
      answer: richText(
        paragraph(
          'Both can be excellent choices. New-builds often come with modern finishes, warranties, and sometimes off-plan payment schedules. Resale properties can offer established communities, immediate availability, and more room to negotiate on price.',
        ),
        paragraph(
          'Tax treatment also differs: new-builds usually attract VAT (IVA) plus stamp duty, while resales attract transfer tax (ITP). We help you compare total costs for the properties you are considering.',
        ),
      ),
    },
    {
      question: 'Can non-residents get a mortgage in Spain?',
      answer: richText(
        paragraph(
          'Yes. Many Spanish banks lend to non-residents, typically up to around 60–70% of the valuation or purchase price (whichever is lower), depending on your profile and the lender.',
        ),
        paragraph(
          'You will usually need proof of income, tax returns, bank statements, and identification. A local mortgage broker can compare offers and prepare your file so the process stays efficient.',
        ),
      ),
    },
    {
      question: 'What additional costs should I budget for when buying?',
      answer: richText(
        paragraph('Beyond the purchase price, plan for approximately 10–13% in buying costs, which may include:'),
        bulletList([
          {
            label: 'Transfer tax (resale) or VAT + stamp duty (new-build)',
            children: [
              'Resale: transfer tax (ITP) varies by region — often around 7–10%.',
              'New-build: 21% VAT (IVA) plus stamp duty (AJD), commonly around 1.2–1.5%.',
            ],
          },
          'Notary and land registry fees — typically around 1–2% combined.',
          'Local / municipal fees and administrative costs — often around 1%.',
          'Lawyer / gestoría fees for conveyancing and registration.',
          'Agent fees — usually paid by the seller, but confirm in writing for each deal.',
          'Mortgage costs if financing (valuation, arrangement fees, related taxes).',
        ]),
      ),
    },
    {
      question: 'What annual costs will I have as an owner?',
      answer: richText(
        paragraph('Ongoing ownership costs typically include:'),
        bulletList([
          'IBI — annual local property tax.',
          'Community fees — for shared areas, pools, gardens, and building maintenance.',
          'Utilities — electricity, water, internet, and waste charges.',
          'Home insurance — strongly recommended.',
          'Income tax for non-residents — imputed or rental income tax may apply even if the property is not rented.',
        ]),
        paragraph(
          'We can estimate these costs for any listing so you know the true yearly budget before you buy.',
        ),
      ),
    },
    {
      question: 'What documents do I need to buy a property in Spain?',
      answer: richText(
        paragraph('Most buyers will need:'),
        bulletList([
          'Valid passport (or EU ID card).',
          'NIE number — Spanish foreigner identification number, required for the purchase and tax registration.',
          'Proof of funds / mortgage approval documents.',
          'Spanish bank account details for payments and utilities (recommended).',
          'Power of attorney if you cannot attend completion in person.',
        ]),
        paragraph(
          'Your lawyer will confirm the exact checklist for your nationality and financing situation.',
        ),
      ),
    },
    {
      question: 'Do I need a lawyer, or can I rely on the notary alone?',
      answer: richText(
        paragraph(
          'The notary authenticates the deed and checks certain formalities, but does not replace independent legal advice. We strongly recommend instructing your own lawyer to review title, debts, licences, community status, planning issues, and contract terms before you commit.',
        ),
        paragraph(
          'Independent advice is especially important for off-plan purchases, rural land, or properties with commercial use.',
        ),
      ),
    },
    {
      question: 'Do I need a Spanish bank account?',
      answer: richText(
        paragraph(
          'It is highly recommended. A Spanish account makes it easier to pay the deposit and completion funds, set up direct debits for utilities and community fees, and receive rental income if you let the property.',
        ),
        paragraph(
          'Opening an account usually requires your passport, NIE, and proof of address. We can introduce you to banks that regularly work with international clients.',
        ),
      ),
    },
    {
      question: 'Should I make a Spanish will?',
      answer: richText(
        paragraph(
          'Many owners choose a Spanish will covering Spanish assets. It can simplify inheritance formalities for heirs and clarify how Spanish property should pass under Spanish succession rules.',
        ),
        paragraph(
          'Cross-border inheritance involves both Spanish and home-country law. Speak with a specialist lawyer or tax advisor so your wills and tax planning work together.',
        ),
      ),
    },
    {
      question: 'What costs are involved if I sell later?',
      answer: richText(
        paragraph('When selling, typical costs may include:'),
        bulletList([
          'Capital gains tax — commonly 19% on net profit for non-residents (confirm current rates and allowable deductions).',
          'Plusvalía — municipal tax on the increase in land value since acquisition.',
          'Estate agent commission — often around 5% plus VAT, depending on the mandate.',
          'Notary, registry, and legal fees related to the sale.',
        ]),
        paragraph(
          'Withholding rules can apply for non-resident sellers. Your lawyer and tax advisor should calculate net proceeds before you accept an offer.',
        ),
      ),
    },
    {
      question: 'How can your agency help me through the process?',
      answer: richText(
        paragraph(
          'We help you shortlist properties that match your lifestyle and budget, arrange viewings, negotiate terms, and introduce trusted lawyers, mortgage brokers, and other local professionals.',
        ),
        paragraph(
          'From first enquiry to handover — and beyond for rentals or resale — our role is to keep the process clear, organised, and aligned with your goals.',
        ),
      ),
    },
  ],
}
