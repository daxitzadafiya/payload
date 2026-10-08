import { getCachedGlobal } from '@/utilities/getGlobals'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import Link from 'next/link'
import React from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { Media } from '@/components/Media'
import { SocialIcon } from '@/components/SocialIcon'
import { getLogoSources } from '@/components/Logo/getLogoSources'
import { DEFAULT_APP_NAME, getAppName } from '@/utilities/getAppName'
import {
  DEFAULT_POWERED_BY_LINK_LABEL,
  DEFAULT_POWERED_BY_TEXT,
  DEFAULT_POWERED_BY_URL,
  DEFAULT_RIGHTS_RESERVED,
} from '@/Footer/formatCopyright'
import type { FooterColumnWidth } from '@/Footer/sectionLayoutFields'
import type { Footer as FooterType, Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/ui'

const COLUMN_WIDTH_CLASS: Record<FooterColumnWidth, string> = {
  '2': 'md:col-span-2',
  '3': 'md:col-span-3',
  '4': 'md:col-span-4',
}

const DEFAULT_SECTION_ORDER = {
  brand: 1,
  quickLinks: 2,
  contact: 3,
  certifications: 4,
} as const

type ColumnSectionKey = keyof typeof DEFAULT_SECTION_ORDER

function resolveColumnWidth(value: string | null | undefined): FooterColumnWidth {
  if (value === '2' || value === '3' || value === '4') return value
  return '3'
}

function isShown(value: boolean | null | undefined): boolean {
  return value !== false
}

function resolveOrder(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const FooterSectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-5 md:mb-6">
    <div className="mb-3 flex items-center gap-2.5" aria-hidden>
      <span className="h-px w-8 bg-secondary" />
      <span className="h-1 w-1 rotate-45 bg-secondary" />
    </div>
    <h4 className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
      {children}
    </h4>
  </div>
)

const contactIconClassName =
  'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-secondary/50 text-white'

export async function Footer() {
  const { locale } = await getActiveLocale()
  const [footerData, logoData] = await Promise.all([
    getCachedGlobal('footer', 1, locale)(),
    getCachedGlobal('logo', 1)(),
  ])

  const logoSources = getLogoSources(logoData)
  const appName = getAppName(logoData)

  const tagline = footerData?.tagline
  const socialLinks = footerData?.socialLinks ?? []
  const quickLinksTitle = footerData?.quickLinksTitle ?? 'QUICK LINKS'
  const navItems = footerData?.navItems ?? []
  const contactTitle = footerData?.contactTitle ?? 'CONTACT US'
  const contact = footerData?.contact
  const addresses = (contact?.addresses ?? []).flatMap((row) => {
    const address = row?.address?.trim()
    if (!address) return []
    return [{ id: row.id, address }]
  })
  const certificationsTitle = footerData?.certificationsTitle ?? 'CERTIFICATIONS'
  const certifications = footerData?.certifications ?? []
  const certificationsHref = getCMSLinkHref(footerData?.certificationsLink ?? {})
  const certificationsNewTab = Boolean(footerData?.certificationsLink?.newTab)
  const rightsReserved = footerData?.copyrightText ?? DEFAULT_RIGHTS_RESERVED
  const poweredByText = footerData?.poweredBy?.text ?? DEFAULT_POWERED_BY_TEXT
  const poweredByLinkLabel =
    footerData?.poweredBy?.linkLabel ?? DEFAULT_POWERED_BY_LINK_LABEL
  const poweredByUrl = footerData?.poweredBy?.url?.trim() || DEFAULT_POWERED_BY_URL
  const showPoweredBy = Boolean(poweredByText.trim() && poweredByLinkLabel.trim())
  const legalLinks = footerData?.legalLinks ?? []

  const data = footerData as FooterType | null

  const columnSections: Array<{
    key: ColumnSectionKey
    order: number
    widthClass: string
    content: React.ReactNode
  }> = []

  if (isShown(data?.brandShowOnSite)) {
    columnSections.push({
      key: 'brand',
      order: resolveOrder(data?.brandDisplayOrder, DEFAULT_SECTION_ORDER.brand),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.brandColumnWidth)],
      content: (
        <>
          <Link className="mb-5 inline-block md:mb-6" href="/">
            <Logo placement="footer" onDarkBackground sources={logoSources} />
          </Link>
          {tagline ? (
            <p className="mb-6 max-w-sm font-body-md text-[14px] font-light leading-[1.8] text-white md:mb-7 md:text-[15px]">
              {tagline}
            </p>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {socialLinks.map(({ icon, url, newTab, id }, i) => (
                <a
                  key={id || i}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-md',
                    'border border-secondary/50 text-white transition-all duration-300',
                    'hover:border-secondary hover:bg-secondary hover:text-on-secondary',
                  )}
                  href={url}
                  rel={newTab ? 'noopener noreferrer' : undefined}
                  target={newTab ? '_blank' : undefined}
                >
                  <SocialIcon className="text-current" name={icon} size={16} />
                </a>
              ))}
            </div>
          ) : null}
        </>
      ),
    })
  }

  if (isShown(data?.quickLinksShowOnSite)) {
    columnSections.push({
      key: 'quickLinks',
      order: resolveOrder(data?.quickLinksDisplayOrder, DEFAULT_SECTION_ORDER.quickLinks),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.quickLinksColumnWidth)],
      content: (
        <>
          {quickLinksTitle ? <FooterSectionTitle>{quickLinksTitle}</FooterSectionTitle> : null}
          {navItems.length > 0 ? (
            <ul className="m-0 list-none space-y-2.5 p-0 md:space-y-3">
              {navItems.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink
                    className="font-body-md text-[14px] font-light text-white transition-colors duration-300 hover:text-secondary md:text-[15px]"
                    {...link}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ),
    })
  }

  if (isShown(data?.contactShowOnSite)) {
    columnSections.push({
      key: 'contact',
      order: resolveOrder(data?.contactDisplayOrder, DEFAULT_SECTION_ORDER.contact),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.contactColumnWidth)],
      content: (
        <>
          {contactTitle ? <FooterSectionTitle>{contactTitle}</FooterSectionTitle> : null}
          {(contact?.phone || contact?.email || addresses.length > 0) && (
            <ul className="m-0 list-none space-y-4 p-0">
              {contact?.phone ? (
                <li className="flex items-start gap-3 font-body-md text-[14px] font-light text-white md:text-[15px]">
                  <span className={contactIconClassName}>
                    <Phone size={14} strokeWidth={1.6} />
                  </span>
                  <a
                    className="pt-1.5 transition-colors duration-300 hover:text-secondary"
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact?.email ? (
                <li className="flex items-start gap-3 font-body-md text-[14px] font-light text-white md:text-[15px]">
                  <span className={contactIconClassName}>
                    <Mail size={14} strokeWidth={1.6} />
                  </span>
                  <a
                    className="pt-1.5 transition-colors duration-300 hover:text-secondary"
                    href={`mailto:${contact.email}`}
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {addresses.map(({ id, address }) => (
                <li
                  key={id || address}
                  className="flex items-start gap-3 font-body-md text-[14px] font-light leading-[1.7] text-white md:text-[15px]"
                >
                  <span className={contactIconClassName}>
                    <MapPin size={14} strokeWidth={1.6} />
                  </span>
                  <span className="pt-1.5">{address}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ),
    })
  }

  if (isShown(data?.certificationsShowOnSite)) {
    columnSections.push({
      key: 'certifications',
      order: resolveOrder(data?.certificationsDisplayOrder, DEFAULT_SECTION_ORDER.certifications),
      widthClass: COLUMN_WIDTH_CLASS[resolveColumnWidth(data?.certificationsColumnWidth)],
      content: (
        <>
          {certificationsTitle ? (
            <FooterSectionTitle>{certificationsTitle}</FooterSectionTitle>
          ) : null}
          {certifications.length > 0 ? (
            <div className="grid w-full grid-cols-2 gap-3">
              {certifications.map(({ image, label, id }, i) => {
                const media =
                  typeof image === 'object' && image !== null ? (image as MediaType) : null
                if (!media) return null

                const alt = label || media.alt || 'Certification'
                const badge = (
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-[0.85rem] border border-secondary/35 transition-all duration-300 hover:border-secondary/70 hover:shadow-[0_14px_28px_-16px_rgba(0,0,0,0.35)]">
                    <Media
                      resource={media}
                      alt={alt}
                      fill
                      imgClassName="object-contain p-2"
                      className="absolute inset-0"
                    />
                  </div>
                )

                if (!certificationsHref) {
                  return <div key={id || i}>{badge}</div>
                }

                return (
                  <Link
                    key={id || i}
                    href={certificationsHref}
                    target={certificationsNewTab ? '_blank' : undefined}
                    rel={certificationsNewTab ? 'noopener noreferrer' : undefined}
                    aria-label={alt}
                    className="block"
                  >
                    {badge}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </>
      ),
    })
  }

  columnSections.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return DEFAULT_SECTION_ORDER[a.key] - DEFAULT_SECTION_ORDER[b.key]
  })

  const showBottomBar = isShown(data?.bottomBarShowOnSite)
  const hasColumns = columnSections.length > 0

  if (!hasColumns && !showBottomBar) {
    return null
  }

  return (
    <footer className="relative overflow-hidden bg-black text-white reveal active">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
      </div>

      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -left-[16%] top-[10%] h-[70%] w-[42%] text-secondary opacity-35 max-lg:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="pointer-events-none -right-16 bottom-8 h-64 w-64 text-secondary opacity-30 md:-right-10 md:h-80 md:w-80"
      />

      {hasColumns ? (
        <div className="relative mx-auto max-w-max-width px-margin-mobile py-14 md:px-margin-desktop md:py-16 lg:py-20">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 md:grid-cols-12 md:gap-x-8 md:gap-y-10 lg:gap-x-10">
            {columnSections.map(({ key, widthClass, content }) => (
              <div key={key} className={cn('sm:col-span-1', widthClass)}>
                {content}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showBottomBar ? (
        <div className="relative">
          <div
            className="pointer-events-none mx-auto flex max-w-max-width items-center gap-4 px-margin-mobile md:px-margin-desktop"
            aria-hidden
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-secondary/45 to-secondary/20" />
            <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-secondary/45 to-secondary/20" />
          </div>

          <div
            className={cn(
              'mx-auto max-w-max-width px-margin-mobile py-5 md:px-margin-desktop md:py-6',
              'flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left',
            )}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 md:justify-start">
              {rightsReserved ? (
                <p className="font-label-sm text-[11px] uppercase tracking-[0.1em] text-white/75">
                  © {new Date().getFullYear()}{' '}
                  <span className="text-white">{appName || DEFAULT_APP_NAME}</span>.{' '}
                  {rightsReserved || DEFAULT_RIGHTS_RESERVED}
                </p>
              ) : null}
              {showPoweredBy ? (
                <p className="font-label-sm text-[11px] text-white/75">
                  {poweredByText.trim()}{' '}
                  <a
                    className="text-white/90 transition-colors hover:text-secondary"
                    href={poweredByUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {poweredByLinkLabel.trim()}
                  </a>
                </p>
              ) : null}
            </div>
            {legalLinks.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-end">
                {legalLinks.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    className="font-label-sm text-[11px] uppercase tracking-[0.08em] text-white/75 transition-colors hover:text-secondary"
                    {...link}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </footer>
  )
}
