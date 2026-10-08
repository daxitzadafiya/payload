'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { SocialIcon } from '@/components/SocialIcon'

type Props = Extract<Page['layout'][0], { blockType: 'privacyPolicyBlock' }>

type ContactPanel = NonNullable<NonNullable<Props['sections']>[number]['contactPanel']>

const goldCtaClassName =
  'inline-flex w-fit items-center justify-center gap-2 rounded-md bg-secondary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)] transition-all duration-300 hover:bg-primary hover:text-on-primary hover:shadow-[0_14px_32px_-14px_color-mix(in_srgb,var(--color-primary)_50%,transparent)] active:scale-[0.98] sm:text-[12px]'

function getContactPanelLink(contactPanel: ContactPanel) {
  const { buttonLink, email } = contactPanel
  const hasConfiguredLink = Boolean(
    buttonLink?.url || (buttonLink?.type === 'reference' && buttonLink?.reference),
  )

  if (hasConfiguredLink && buttonLink) {
    return buttonLink
  }

  if (email) {
    return { type: 'custom' as const, url: `mailto:${email}`, newTab: false }
  }

  return null
}

/** CMS labels often already include "01. …" — strip so UI numbers don't double. */
function stripLeadingIndex(label: string | null | undefined) {
  if (!label) return ''
  return label.replace(/^\s*\d{1,2}[.)]\s*/, '').trim()
}

function formatSectionIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

const ContactPanel: React.FC<{ panel: ContactPanel }> = ({ panel }) => {
  const actionLink = getContactPanelLink(panel)

  return (
    <div className="relative mt-10 md:mt-12">
      {/* Offset gold frame — Founder / Template Two pattern */}
      <div
        className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.35rem] border border-secondary/35 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.6rem]"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[1.25rem] bg-surface-sand px-6 py-9 sm:px-8 md:rounded-[1.5rem] md:px-10 md:py-11 lg:px-12">
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-14 -top-12 h-48 w-48 opacity-45"
        />
        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -bottom-20 -left-16 h-56 w-56 max-sm:hidden"
        />

        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-xl">
            <div className="mb-4 flex items-center gap-3" aria-hidden>
              <span className="h-px w-10 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
            </div>

            {panel.title ? (
              <h4 className="m-0 font-headline-sm text-[clamp(1.25rem,2.2vw,1.55rem)] font-light leading-[1.25] tracking-[0.01em] text-primary">
                {panel.title}
              </h4>
            ) : null}

            {panel.email ? (
              <a
                href={`mailto:${panel.email}`}
                className={`inline-block font-label-nav text-[12px] uppercase tracking-[0.22em] text-secondary transition-colors hover:text-primary sm:text-[13px] ${
                  panel.title ? 'mt-3' : ''
                }`}
              >
                {panel.email}
              </a>
            ) : null}
          </div>

          {panel.buttonLabel && actionLink ? (
            <CMSLink
              {...actionLink}
              appearance="inline"
              className={goldCtaClassName}
              label={panel.buttonLabel}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export const PrivacyPolicyBlock: React.FC<Props> = ({
  eyebrow,
  title,
  introText,
  tocTitle,
  sections,
}) => {
  const ref = useReveal()
  const sectionList = sections || []
  const validSections = useMemo(
    () => sectionList.filter((section) => Boolean(section.anchorId)),
    [sectionList],
  )
  const tocEntries = useMemo(
    () => sectionList.filter((section) => Boolean(section.anchorId && section.tocLabel)),
    [sectionList],
  )
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    validSections[0]?.anchorId || null,
  )

  useEffect(() => {
    if (!validSections.length) return

    const sectionElements = validSections
      .map((section) => document.getElementById(section.anchorId || ''))
      .filter((el): el is HTMLElement => Boolean(el))

    if (!sectionElements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-25% 0px -60% 0px',
        threshold: [0.15, 0.35, 0.55],
      },
    )

    sectionElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [validSections])

  return (
    <div ref={ref}>
      {/* Intro — cream editorial masthead */}
      <header className="relative overflow-hidden bg-surface-cream pb-14 pt-28 md:pb-16 md:pt-36 lg:pb-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          aria-hidden
        >
          <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
        </div>

        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -left-[18%] top-[4%] h-[72%] w-[48%] max-lg:hidden"
        />
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-20 top-16 h-72 w-72 opacity-50 md:-right-12 md:top-24 md:h-96 md:w-96"
        />

        <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-end gap-10 px-margin-mobile md:grid-cols-12 md:gap-8 md:px-margin-desktop lg:gap-12">
          <div className="reveal md:col-span-7 lg:col-span-8">
            {eyebrow ? (
              <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1 className="m-0 max-w-3xl font-display-lg text-[clamp(2.25rem,4.6vw,3.6rem)] font-light leading-[1.1] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            <div className="mt-6 flex items-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-14 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-8 bg-secondary/40" />
            </div>

            {introText ? (
              <p className="mt-6 m-0 max-w-2xl font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/75 md:mt-8 md:text-[16px] md:leading-[1.9]">
                {introText}
              </p>
            ) : null}
          </div>

          {tocEntries.length > 0 ? (
            <div className="reveal delay-150 hidden md:col-span-5 md:block lg:col-span-4">
              <div className="rounded-[1.5rem] border border-secondary/25 bg-surface-sand/60 px-6 py-6 lg:px-7 lg:py-7">
                {tocTitle ? (
                  <p className="mb-4 m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary">
                    {tocTitle}
                  </p>
                ) : null}
                <nav className="flex flex-col gap-0.5" aria-label="Quick contents">
                  {tocEntries.map((section, i) => (
                    <a
                      key={section.id || i}
                      href={`#${section.anchorId}`}
                      className="group flex items-baseline gap-3 py-1.5 font-label-nav text-[11px] uppercase tracking-[0.1em] text-on-surface/55 transition-colors hover:text-primary"
                    >
                      <span className="shrink-0 text-secondary/70 tabular-nums">
                        {formatSectionIndex(i)}
                      </span>
                      <span className="truncate group-hover:underline group-hover:decoration-secondary/50 group-hover:underline-offset-4">
                        {stripLeadingIndex(section.tocLabel)}
                      </span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {/* Body — sand reading surface */}
      <section className="relative overflow-hidden bg-surface-sand pb-20 pt-12 md:pb-28 md:pt-16 lg:pt-20">
        <DecorativeVectors
          variant="grid"
          tone="whisper"
          className="pointer-events-none -left-8 top-24 h-80 w-52 max-lg:hidden"
        />
        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -right-[16%] bottom-[10%] h-[50%] w-[40%] max-md:hidden"
        />

        {/* Mobile TOC — horizontal chips */}
        {tocEntries.length > 0 ? (
          <div className="reveal relative mb-10 md:hidden">
            <div className="px-margin-mobile">
              {tocTitle ? (
                <p className="mb-3 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary">
                  {tocTitle}
                </p>
              ) : null}
            </div>
            <nav
              className="flex gap-2 overflow-x-auto px-margin-mobile pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Table of contents"
            >
              {tocEntries.map((section, i) => {
                const isActive = activeSectionId === section.anchorId
                return (
                  <a
                    key={section.id || i}
                    href={`#${section.anchorId}`}
                    className={`shrink-0 rounded-md px-3.5 py-2 font-label-nav text-[11px] uppercase tracking-[0.12em] transition-colors ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-cream/80 text-on-surface/60'
                    }`}
                  >
                    {formatSectionIndex(i)}. {stripLeadingIndex(section.tocLabel)}
                  </a>
                )
              })}
            </nav>
          </div>
        ) : null}

        <div className="relative mx-auto flex max-w-max-width flex-col gap-10 px-margin-mobile md:flex-row md:gap-12 md:px-margin-desktop lg:gap-14">
          {/* Desktop sticky TOC */}
          <aside className="hidden md:block md:w-[23%] lg:w-1/4">
            <div className="reveal sticky top-28">
              <div className="mb-5 flex items-center gap-3" aria-hidden>
                <span className="h-px w-6 bg-secondary/60" />
                <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              </div>
              {tocTitle ? (
                <h3 className="mb-5 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                  {tocTitle}
                </h3>
              ) : null}
              <nav className="flex flex-col" aria-label="Table of contents">
                {tocEntries.map((section, i) => {
                  const isActive = activeSectionId === section.anchorId
                  return (
                    <a
                      key={section.id || i}
                      className={`group flex items-start gap-3 border-l py-3 pl-4 transition-colors duration-300 ${
                        isActive
                          ? 'border-secondary text-primary'
                          : 'border-secondary/20 text-on-surface/50 hover:border-secondary/45 hover:text-primary'
                      }`}
                      href={`#${section.anchorId}`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 font-label-nav text-[10px] tabular-nums tracking-[0.08em] ${
                          isActive ? 'text-secondary' : 'text-secondary/50'
                        }`}
                      >
                        {formatSectionIndex(i)}
                      </span>
                      <span className="font-label-nav text-[11px] uppercase leading-snug tracking-[0.1em] sm:text-[12px]">
                        {stripLeadingIndex(section.tocLabel)}
                      </span>
                    </a>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Reading panel */}
          <article className="min-w-0 flex-1 md:w-[77%] lg:w-3/4">
            <div className="reveal relative rounded-[1.5rem] bg-surface-cream/75 px-5 py-8 sm:px-7 sm:py-10 md:rounded-[2rem] md:px-10 md:py-12 lg:px-12 lg:py-14">
              {sectionList.map((section, i) => {
                const sectionIndex = tocEntries.findIndex((s) => s.anchorId === section.anchorId)
                const displayIndex = sectionIndex >= 0 ? sectionIndex : i

                return (
                  <React.Fragment key={section.id || i}>
                    {section.showDividerBefore ? (
                      <div className="my-10 flex items-center gap-4 md:my-14" aria-hidden>
                        <span className="h-px flex-1 bg-gradient-to-r from-secondary/45 via-secondary/20 to-transparent" />
                        <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
                        <span className="h-px w-10 bg-secondary/25" />
                      </div>
                    ) : null}

                    <section
                      className={`${i > 0 && !section.showDividerBefore ? 'mt-12 md:mt-14' : ''} scroll-mt-32`}
                      id={section.anchorId || undefined}
                    >
                      <div className="mb-5 flex items-start gap-4 md:mb-6 md:gap-5">
                        {section.anchorId ? (
                          <span
                            className="mt-1 shrink-0 font-label-nav text-[11px] tabular-nums tracking-[0.14em] text-secondary sm:text-[12px]"
                            aria-hidden
                          >
                            {formatSectionIndex(displayIndex)}
                          </span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          {section.heading ? (
                            <h2 className="m-0 font-headline-md text-[clamp(1.4rem,2.4vw,1.85rem)] font-light leading-[1.25] tracking-[0.01em] text-primary">
                              {stripLeadingIndex(section.heading)}
                            </h2>
                          ) : null}
                        </div>
                      </div>

                      {section.body ? (
                        <RichText
                          enableProse={false}
                          enableGutter={false}
                          className={[
                            'policy-body max-w-none',
                            '[&_a]:text-primary [&_a]:underline [&_a]:decoration-secondary/55 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:decoration-primary',
                            // Editorial subheads (h3 / h4)
                            '[&_h3]:mt-9 [&_h3]:mb-3 [&_h3]:border-l-2 [&_h3]:border-secondary [&_h3]:pl-4 [&_h3]:font-headline-sm [&_h3]:text-[clamp(1.1rem,2vw,1.3rem)] [&_h3]:font-light [&_h3]:leading-[1.35] [&_h3]:tracking-[0.01em] [&_h3]:text-primary',
                            '[&_h4]:mt-8 [&_h4]:mb-2.5 [&_h4]:border-l-2 [&_h4]:border-secondary/70 [&_h4]:pl-4 [&_h4]:font-label-nav [&_h4]:text-[11px] [&_h4]:uppercase [&_h4]:tracking-[0.16em] [&_h4]:text-primary sm:[&_h4]:text-[12px]',
                            // Bold-only paragraphs used as cookie-type titles in CMS
                            '[&_p:has(>strong:only-child)]:mt-8 [&_p:has(>strong:only-child)]:mb-2.5 [&_p:has(>strong:only-child)]:border-l-2 [&_p:has(>strong:only-child)]:border-secondary [&_p:has(>strong:only-child)]:pl-4',
                            '[&_p:has(>strong:only-child)>strong]:font-headline-sm [&_p:has(>strong:only-child)>strong]:text-[clamp(1.1rem,2vw,1.3rem)] [&_p:has(>strong:only-child)>strong]:font-light [&_p:has(>strong:only-child)>strong]:leading-[1.35] [&_p:has(>strong:only-child)>strong]:tracking-[0.01em] [&_p:has(>strong:only-child)>strong]:text-primary',
                            // Strong that starts a paragraph (title + trailing text in same p)
                            '[&_p:has(>strong:first-child:not(:only-child))]:mt-7',
                            '[&_p>strong:first-child]:text-primary [&_p>strong:first-child]:font-medium',
                            '[&_li]:my-1.5 [&_li]:font-body-md [&_li]:text-[15px] [&_li]:font-light [&_li]:leading-[1.8] [&_li]:text-on-surface/75',
                            '[&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-5',
                            '[&_p]:mb-5 [&_p]:font-body-md [&_p]:text-[15px] [&_p]:font-light [&_p]:leading-[1.85] [&_p]:text-on-surface/75 md:[&_p]:text-[16px] md:[&_p]:leading-[1.9]',
                          ].join(' ')}
                          data={section.body}
                        />
                      ) : null}

                      {section.highlightQuote ? (
                        <blockquote className="relative my-8 border-l-0 px-0 py-2 md:my-10">
                          <span
                            className="mb-4 block h-px w-12 bg-secondary"
                            aria-hidden
                          />
                          <p className="m-0 font-headline-sm text-[clamp(1.15rem,2.2vw,1.45rem)] font-light italic leading-[1.5] tracking-[0.01em] text-primary">
                            {section.highlightQuote}
                          </p>
                        </blockquote>
                      ) : null}

                      {section.featureCards && section.featureCards.length > 0 ? (
                        <div className="my-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:my-10">
                          {section.featureCards.map((card, cardIndex) => (
                            <div
                              className="border-t border-secondary/35 pt-5"
                              key={card.id || cardIndex}
                            >
                              {card.icon ? (
                                <SocialIcon
                                  className="mb-3 text-secondary"
                                  name={card.icon}
                                  size={20}
                                />
                              ) : null}
                              {card.title ? (
                                <h4 className="mb-2 m-0 font-label-nav text-[11px] uppercase tracking-[0.16em] text-primary sm:text-[12px]">
                                  {card.title}
                                </h4>
                              ) : null}
                              {card.description ? (
                                <p className="m-0 font-body-md text-[14px] font-light leading-[1.7] text-on-surface/65">
                                  {card.description}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {section.bulletItems && section.bulletItems.length > 0 ? (
                        <ul className="my-6 list-none space-y-4 p-0 md:my-8">
                          {section.bulletItems.map((item, itemIndex) => (
                            <li className="flex items-start gap-3.5" key={item.id || itemIndex}>
                              <SocialIcon
                                className="mt-0.5 shrink-0 text-secondary"
                                name={item.icon || 'FiCheckCircle'}
                                size={18}
                              />
                              <span className="font-body-md text-[15px] font-light leading-[1.75] text-on-surface/75">
                                {item.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {section.visualPanel &&
                      typeof section.visualPanel.image === 'object' &&
                      section.visualPanel.image !== null ? (
                        <div className="group relative my-8 aspect-[16/7] overflow-hidden rounded-[1.25rem] bg-primary md:my-10 md:rounded-[1.5rem]">
                          <Media
                            imgClassName="h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
                            resource={section.visualPanel.image}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-primary/10 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 px-4 text-center sm:flex-row sm:gap-4">
                              {section.visualPanel.icon ? (
                                <SocialIcon
                                  className="text-secondary"
                                  name={section.visualPanel.icon}
                                  size={36}
                                />
                              ) : null}
                              {section.visualPanel.title ? (
                                <h3 className="m-0 font-headline-sm text-[1.05rem] font-light uppercase tracking-[0.2em] text-white md:text-[1.2rem]">
                                  {section.visualPanel.title}
                                </h3>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {section.contactPanel &&
                      (section.contactPanel.title ||
                        section.contactPanel.email ||
                        section.contactPanel.buttonLabel) ? (
                        <ContactPanel panel={section.contactPanel} />
                      ) : null}
                    </section>
                  </React.Fragment>
                )
              })}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
