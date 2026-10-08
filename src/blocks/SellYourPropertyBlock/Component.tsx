'use client'

import React, { useState } from 'react'

import { OwnerFormModal } from '@/blocks/OwnersBlock/OwnerFormModal'
import type { OwnerFormSettings } from '@/blocks/OwnersBlock/ownerFormSettings'
import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import RichText from '@/components/RichText'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type BlockProps = Extract<Page['layout'][0], { blockType: 'sellYourPropertyBlock' }>

type Props = BlockProps & {
  ownerForm?: OwnerFormSettings | null
}

const bodyClassName =
  'sell-prop-body max-w-none font-body-md text-[15px] font-light leading-[1.9] text-on-surface/75 md:text-[16px] [&_a]:text-secondary [&_a]:underline-offset-4 hover:[&_a]:text-primary [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-primary'

const ctaClassName =
  'inline-flex w-fit items-center justify-center rounded-md border border-secondary bg-secondary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_30px_-16px_color-mix(in_srgb,var(--color-secondary)_70%,transparent)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary hover:shadow-[0_14px_34px_-14px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] active:scale-[0.98] sm:text-[12px]'

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

export const SellYourPropertyBlock: React.FC<Props> = ({
  focus,
  eyebrow,
  title,
  introHeading,
  introLead,
  highlight,
  offersHeading,
  offers,
  ctaLabel,
  whyHeading,
  whyLead,
  quotes,
  closing,
  ownerForm,
}) => {
  const ref = useReveal()
  const [ownerFormOpen, setOwnerFormOpen] = useState(false)
  const offerList = (offers ?? []).filter((item) => Boolean(item.text?.trim()))
  const quoteList = (quotes ?? []).filter((item) => Boolean(item.text?.trim()))
  const buttonLabel = ctaLabel?.trim()
  const ownerIntent = focus === 'rent' ? 'rent' : 'sale'
  const showCta = Boolean(buttonLabel)

  const isRent = focus === 'rent'
  const expertLabel = useTranslation(
    isRent ? 'rentProperty.expertLabel' : 'sellProperty.expertLabel',
    isRent ? 'Rental experts' : 'Selling experts',
  )
  const expertTitle = useTranslation(
    isRent ? 'rentProperty.expertTitle' : 'sellProperty.expertTitle',
    'Costa del Sol specialists',
  )
  const expertNote = useTranslation(
    isRent ? 'rentProperty.expertNote' : 'sellProperty.expertNote',
    isRent
      ? 'Local knowledge, international reach, and a clear plan from listing to a signed tenancy.'
      : 'Local knowledge, international reach, and a clear plan from valuation to closing.',
  )
  const approachLabel = useTranslation(
    isRent ? 'rentProperty.approachLabel' : 'sellProperty.approachLabel',
    'Our approach',
  )
  const offersLabel = useTranslation(
    isRent ? 'rentProperty.offersLabel' : 'sellProperty.offersLabel',
    'What you get',
  )
  const voicesLabel = useTranslation(
    isRent ? 'rentProperty.voicesLabel' : 'sellProperty.voicesLabel',
    'Client voices',
  )

  const renderCta = () => {
    if (!buttonLabel) return null

    return (
      <button
        type="button"
        onClick={() => setOwnerFormOpen(true)}
        className={cn(ctaClassName, 'cursor-pointer')}
      >
        {buttonLabel}
      </button>
    )
  }

  return (
    <div ref={ref}>
      <header className="relative overflow-hidden bg-surface-cream pb-16 pt-28 md:pb-20 md:pt-36 lg:pb-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 65% 50% at 8% 20%, color-mix(in srgb, var(--color-secondary) 28%, transparent), transparent 55%), radial-gradient(ellipse 50% 45% at 92% 75%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 50%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          aria-hidden
        >
          <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
        </div>
        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -left-[18%] top-[2%] h-[78%] w-[50%] max-lg:hidden"
        />
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-20 top-14 h-80 w-80 opacity-45 md:-right-10 md:top-20 md:h-[26rem] md:w-[26rem]"
        />

        <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-end gap-10 px-margin-mobile md:grid-cols-12 md:gap-8 md:px-margin-desktop lg:gap-12">
          <div className="reveal md:col-span-7 lg:col-span-8">
            {eyebrow ? (
              <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1 className="m-0 max-w-3xl font-display-lg text-[clamp(2.3rem,4.8vw,3.75rem)] font-light leading-[1.05] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            <div className="mt-6 flex items-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-16 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-10 bg-secondary/40" />
            </div>

            {introHeading ? (
              <p className="mt-6 m-0 font-headline-sm text-[clamp(1.15rem,2.1vw,1.5rem)] font-light leading-snug tracking-[0.01em] text-primary md:mt-8">
                {introHeading}
              </p>
            ) : null}

            {introLead ? (
              <p className="mt-3 m-0 max-w-2xl font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/70 md:text-[16px]">
                {introLead}
              </p>
            ) : null}
          </div>

          <div className="reveal delay-150 md:col-span-5 lg:col-span-4">
            <aside className="relative overflow-hidden rounded-[1.35rem] border border-secondary/30 bg-surface-sand/70 px-6 py-7 md:rounded-[1.5rem] md:px-7 md:py-8">
              <DecorativeVectors
                variant="rings"
                tone="whisper"
                className="pointer-events-none -right-10 -top-8 h-36 w-36 opacity-40"
              />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3" aria-hidden>
                  <span className="h-px w-8 bg-secondary" />
                  <span className="h-1 w-1 rotate-45 bg-secondary" />
                </div>
                <p className="m-0 font-label-nav text-[10px] uppercase tracking-[0.28em] text-secondary sm:text-[11px]">
                  {expertLabel}
                </p>
                <p className="mt-3 m-0 font-headline-sm text-[clamp(1.05rem,1.8vw,1.25rem)] font-light leading-snug tracking-[0.01em] text-primary">
                  {expertTitle}
                </p>
                <p className="mt-4 m-0 font-body-md text-[13px] font-light leading-[1.7] text-on-surface/65 sm:text-[14px]">
                  {expertNote}
                </p>
                {showCta ? <div className="mt-6">{renderCta()}</div> : null}
              </div>
            </aside>
          </div>
        </div>
      </header>

      {/* Highlight + offers */}
      <section className="relative overflow-hidden bg-surface-sand pb-10 pt-10 md:pb-12 md:pt-14 lg:pt-16">
        <DecorativeVectors
          variant="grid"
          tone="whisper"
          className="pointer-events-none -left-6 top-20 h-72 w-48 max-lg:hidden"
        />

        <div className="relative mx-auto max-w-max-width space-y-10 px-margin-mobile md:space-y-12 md:px-margin-desktop">
          {highlight ? (
            <div className="reveal relative">
              <div
                className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
                aria-hidden
              />
              <article className="relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-5 py-9 shadow-[0_24px_52px_-28px_rgba(0,0,0,0.16)] sm:px-8 sm:py-11 md:rounded-[1.55rem] md:px-11 md:py-14">
                <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                <DecorativeVectors
                  variant="swirl"
                  tone="whisper"
                  className="pointer-events-none -bottom-20 -right-14 h-56 w-56 opacity-25 max-md:hidden"
                />
                <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-4">
                    <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary">
                      {approachLabel}
                    </p>
                    <div className="mt-5 h-px w-12 bg-secondary" aria-hidden />
                  </div>
                  <div className="lg:col-span-8">
                    <RichText
                      data={highlight}
                      enableGutter={false}
                      enableProse={false}
                      className={cn(
                        bodyClassName,
                        '[&_p]:mb-0 [&_p]:font-headline-sm [&_p]:text-[clamp(1.15rem,2vw,1.45rem)] [&_p]:font-light [&_p]:leading-[1.45] [&_p]:tracking-[0.01em] [&_p]:text-primary [&_strong]:text-primary',
                      )}
                    />
                  </div>
                </div>
              </article>
            </div>
          ) : null}

          {(offersHeading || offerList.length > 0) && (
            <div>
              <div className="reveal delay-100 mb-6 md:mb-8">
                <div className="mb-3 flex items-center gap-3" aria-hidden>
                  <span className="h-px w-10 bg-secondary" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
                </div>
                <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                  {offersLabel}
                </p>
                {offersHeading ? (
                  <h2 className="mt-3 m-0 max-w-2xl font-headline-md text-[clamp(1.3rem,2.3vw,1.75rem)] font-light leading-snug tracking-[0.01em] text-primary">
                    {offersHeading}
                  </h2>
                ) : null}
              </div>

              {offerList.length > 0 ? (
                <div className="reveal delay-150 relative">
                  <div
                    className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-4 py-6 shadow-[0_24px_52px_-28px_rgba(0,0,0,0.16)] sm:px-6 sm:py-8 md:rounded-[1.55rem] md:px-8 md:py-10">
                    <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                    <ul className="relative m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                      {offerList.map((item, index) => (
                        <li
                          key={item.id || index}
                          className="group flex items-start gap-3.5 rounded-xl border border-secondary/15 bg-surface-sand/50 px-4 py-4 transition-colors duration-300 hover:border-secondary/35 hover:bg-surface-sand"
                        >
                          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-secondary/40 bg-surface-cream font-label-nav text-[11px] tracking-[0.08em] text-primary transition-colors group-hover:border-secondary group-hover:bg-secondary group-hover:text-on-secondary">
                            {formatIndex(index)}
                          </span>
                          <span className="min-w-0 flex-1 pt-1.5 font-body-md text-[14px] font-light leading-[1.65] text-on-surface/75">
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {showCta ? (
                      <div className="relative mt-8 flex justify-start border-t border-secondary/15 pt-7 md:mt-9">
                        {renderCta()}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Quotes */}
      {(whyHeading || whyLead || quoteList.length > 0 || closing) && (
        <section className="relative overflow-hidden bg-surface-sand pb-16 pt-2 md:pb-24 md:pt-4 lg:pb-28">
          <DecorativeVectors
            variant="rings"
            className="pointer-events-none -right-16 bottom-8 h-64 w-64 opacity-35 md:h-80 md:w-80"
          />

          <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
            <div className="reveal delay-100 mb-6 md:mb-8">
              <div className="mb-3 flex items-center gap-3" aria-hidden>
                <span className="h-px w-10 bg-secondary" />
                <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              </div>
              <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                {voicesLabel}
              </p>
              {whyHeading ? (
                <h2 className="mt-3 m-0 max-w-2xl font-headline-md text-[clamp(1.3rem,2.3vw,1.75rem)] font-light leading-snug tracking-[0.01em] text-primary">
                  {whyHeading}
                </h2>
              ) : null}
              {whyLead ? (
                <p className="mt-3 m-0 font-body-md text-[14px] font-light text-on-surface/60 sm:text-[15px]">
                  {whyLead}
                </p>
              ) : null}
            </div>

            <div className="reveal delay-150 relative">
              <div
                className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
                aria-hidden
              />
              <article className="relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-5 py-8 shadow-[0_24px_52px_-28px_rgba(0,0,0,0.16)] sm:px-8 sm:py-10 md:rounded-[1.55rem] md:px-10 md:py-12">
                <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                <DecorativeVectors
                  variant="swirl"
                  tone="whisper"
                  className="pointer-events-none -bottom-16 -left-12 h-52 w-52 opacity-25 max-md:hidden"
                />

                {quoteList.length > 0 ? (
                  <ul className="relative m-0 grid list-none grid-cols-1 gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                    {quoteList.map((item, index) => (
                      <li
                        key={item.id || index}
                        className="relative rounded-xl border border-secondary/15 bg-surface-sand/45 px-5 py-5"
                      >
                        <span
                          className="absolute left-4 top-2.5 font-display-lg text-[2.1rem] leading-none text-secondary/40"
                          aria-hidden
                        >
                          “
                        </span>
                        <p className="m-0 pt-5 font-body-md text-[14px] font-light italic leading-[1.7] text-on-surface/70 sm:text-[15px]">
                          {item.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {closing ? (
                  <div className="relative mt-9 border-t border-secondary/15 pt-8 md:mt-10">
                    <RichText
                      data={closing}
                      enableGutter={false}
                      enableProse={false}
                      className={cn(bodyClassName, 'max-w-2xl')}
                    />
                  </div>
                ) : null}
              </article>
            </div>
          </div>
        </section>
      )}

      {ownerFormOpen && ownerForm ? (
        <OwnerFormModal
          fixedOwnerIntent={ownerIntent}
          formDomId={`sell-owner-${ownerForm.form.id}`}
          onClose={() => setOwnerFormOpen(false)}
          settings={ownerForm}
        />
      ) : null}
    </div>
  )
}
