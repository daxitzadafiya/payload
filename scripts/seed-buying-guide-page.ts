import 'dotenv/config'

import { getPayload } from 'payload'

import { buyingGuideDefaultContent } from '../src/blocks/BuyingGuideBlock/defaultContent.js'
import config from '../src/payload.config.js'

const SLUG = 'buying-guide'

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
  locale: 'en',
})

const contactFormResult = await payload.find({
  collection: 'forms',
  where: { title: { equals: 'Contact' } },
  limit: 1,
  depth: 0,
})

const contactForm = contactFormResult.docs[0]
if (!contactForm) {
  payload.logger.error('Forms collection has no form titled "Contact". Create it in admin first.')
  process.exit(1)
}

const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })
const footerContact = (footer as { contact?: { phone?: string | null } } | null)?.contact
const callPhone =
  typeof footerContact?.phone === 'string' && footerContact.phone.trim()
    ? footerContact.phone.trim()
    : '+30 210 3388 000'

const layout = [
  {
    blockType: 'buyingGuideBlock' as const,
    ...buyingGuideDefaultContent,
  },
  {
    blockType: 'contactSectionBlock' as const,
    layoutStyle: 'inquiryBanner' as const,
    formTitle: 'Do you need more information?',
    formDescription:
      'Tell us your wishes and we will send you all of the information by e-mail.',
    formPhone: callPhone,
    formEyebrow: 'Inquiry',
    formTrustNote: "Your information is safe with us. We'll never share your details.",
    submitLabelOverride: 'SEND',
    enableResubmit: true,
    resubmitButtonLabel: '',
    successTitle: 'Thank you!',
    successSubtitle: 'Your response has been submitted.',
    offices: [],
    form: contactForm.id,
  },
]

const pageData = {
  title: 'Buying guide',
  slug: SLUG,
  _status: 'published' as const,
  hero: { type: 'none' as const },
  layout,
  meta: {
    title: 'Buying guide in Spain',
    description:
      'Step-by-step buying guide for property in Spain — budget, locations, process, taxes, rentals, and key points.',
  },
}

const pageId = existing.docs[0]
  ? (
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: pageData,
        locale: 'en',
        context: { disableRevalidate: true },
      })
    ).id
  : (
      await payload.create({
        collection: 'pages',
        data: pageData,
        locale: 'en',
        context: { disableRevalidate: true },
      })
    ).id

// Localized block fields: update each locale separately without replacing the full
// layout array (that can drop sibling locale rows in SQLite).
const inquiryCopy = {
  formTitle: 'Do you need more information?',
  formDescription: 'Tell us your wishes and we will send you all of the information by e-mail.',
  formPhone: callPhone,
  formEyebrow: 'Inquiry',
  formTrustNote: "Your information is safe with us. We'll never share your details.",
  submitLabelOverride: 'SEND',
  successTitle: 'Thank you!',
  successSubtitle: 'Your response has been submitted.',
}

for (const locale of ['en', 'es', 'fr'] as const) {
  const doc = await payload.findByID({
    collection: 'pages',
    id: pageId,
    locale,
    depth: 0,
  })
  const layout = Array.isArray(doc.layout) ? [...doc.layout] : []
  const idx = layout.findIndex(
    (b) => b && typeof b === 'object' && 'blockType' in b && b.blockType === 'contactSectionBlock',
  )
  if (idx === -1) continue
  layout[idx] = {
    ...(layout[idx] as object),
    ...inquiryCopy,
    blockType: 'contactSectionBlock',
    layoutStyle: 'inquiryBanner',
    resubmitButtonLabel: '',
    offices: [],
    form: contactForm.id,
  } as unknown as (typeof layout)[number]
  await payload.update({
    collection: 'pages',
    id: pageId,
    data: { layout },
    locale,
    context: { disableRevalidate: true },
  })
}

payload.logger.info(
  `${existing.docs[0] ? 'Updated' : 'Created'} /${SLUG} (id ${pageId}) with inquiry banner + Forms "${contactForm.title}" (id ${contactForm.id})`,
)

process.exit(0)
