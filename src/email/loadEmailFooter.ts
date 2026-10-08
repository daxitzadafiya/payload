import type { Payload } from 'payload'

import { formatFooterCopyright } from '@/Footer/formatCopyright'
import type { Footer } from '@/payload-types'

export type EmailFooterContent = {
  helpTitle: string
  helpText: string
  address: string
  phone: string
  email: string
  copyright: string
  poweredByText: string
  poweredByLabel: string
  poweredByUrl: string
}

function isShown(value: boolean | null | undefined): boolean {
  return value !== false
}

export async function loadEmailFooter(
  payload: Payload,
  locale: string,
  siteName: string,
): Promise<EmailFooterContent> {
  const footer = await payload
    .findGlobal({
      slug: 'footer',
      depth: 0,
      locale: locale as 'en',
      fallbackLocale: 'en',
      overrideAccess: true,
    })
    .catch(() => null)

  const doc = footer as Footer | null
  const showContact = isShown(doc?.contactShowOnSite)
  const showBrand = isShown(doc?.brandShowOnSite)
  const showBottom = isShown(doc?.bottomBarShowOnSite)
  const contact = showContact ? doc?.contact : undefined

  return {
    helpTitle: showContact ? doc?.contactTitle?.trim() || '' : '',
    helpText: showBrand ? doc?.tagline?.trim() || '' : '',
    address: (contact?.addresses ?? [])
      .map((row) => row?.address?.trim())
      .filter((value): value is string => Boolean(value))
      .join('\n'),
    phone: contact?.phone?.trim() || '',
    email: contact?.email?.trim() || '',
    copyright: showBottom ? formatFooterCopyright(doc?.copyrightText?.trim() || '', siteName) : '',
    poweredByText: showBottom ? doc?.poweredBy?.text?.trim() || '' : '',
    poweredByLabel: showBottom ? doc?.poweredBy?.linkLabel?.trim() || '' : '',
    poweredByUrl: showBottom ? doc?.poweredBy?.url?.trim() || '' : '',
  }
}
