'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import React from 'react'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import { Media } from '@/components/Media'
import type { Page } from '@/payload-types'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'

import { ContactForm } from './ContactForm'

type Props = Extract<Page['layout'][0], { blockType: 'contactSectionBlock' }>

export const ContactSectionBlock: React.FC<Props> = ({
  layoutStyle,
  formEyebrow,
  formTitle,
  formDescription,
  formPhone,
  submitLabelOverride,
  formTrustNote,
  enableResubmit,
  resubmitButtonLabel,
  successTitle,
  successSubtitle,
  offices,
  form,
}) => {
  const formData = typeof form === 'object' && form !== null ? (form as unknown as FormType) : null
  const sectionRef = useReveal()
  const isInquiryBanner = layoutStyle === 'inquiryBanner'

  const translatedEyebrow = useTranslation('contactSection.eyebrow', formEyebrow ?? 'Inquiry')
  const translatedTitle = useTranslation(
    'contactSection.title',
    formTitle ?? 'Private Consultation',
  )
  const translatedDescription = useTranslation(
    'contactSection.description',
    formDescription ??
      'Our specialists are dedicated to finding your ideal heritage property. Please share your requirements below.',
  )
  const translatedSubmitLabel = useTranslation(
    'contactSection.submitLabel',
    submitLabelOverride ?? 'Connect now',
  )
  const translatedTrustNote = useTranslation(
    'contactSection.trustNote',
    formTrustNote ?? "Your information is safe with us. We'll never share your details.",
  )
  const translatedResubmitLabel = useTranslation(
    'contactSection.resubmitLabel',
    resubmitButtonLabel ?? 'Submit another response',
  )
  const translatedSuccessTitle = useTranslation(
    'contactSection.successTitle',
    successTitle ?? 'Thank you!',
  )
  const translatedSuccessSubtitle = useTranslation(
    'contactSection.successSubtitle',
    successSubtitle ?? 'Your response has been submitted.',
  )
  const translatedCallPrefix = useTranslation('contactSection.callPrefix', 'Or call us:')

  const officeList = isInquiryBanner ? [] : (offices ?? [])
  const hasEyebrow = Boolean(formEyebrow?.trim())
  const hasTitle = Boolean(formTitle?.trim())
  const hasDescription = Boolean(formDescription?.trim())
  const hasTrustNote = Boolean(formTrustNote?.trim())
  const hasSubmitOverride = Boolean(submitLabelOverride?.trim())
  const hasResubmitLabel = Boolean(resubmitButtonLabel?.trim())
  const hasSuccessTitle = Boolean(successTitle?.trim())
  const hasSuccessSubtitle = Boolean(successSubtitle?.trim())

  if (isInquiryBanner) {
    // CMS fields are already localized — do NOT use shared contactSection.* translation
    // keys (they collide with the contact page and override Buying Guide copy).
    const bannerEyebrow = formEyebrow?.trim() || 'Inquiry'
    const bannerTitle = formTitle?.trim() || ''
    const bannerDescription = formDescription?.trim() || ''
    const bannerPhone = formPhone?.trim() || ''
    const bannerSubmit = submitLabelOverride?.trim() || null
    const bannerTrust =
      formTrustNote?.trim() ||
      "Your information is safe with us. We'll never share your details."

    return (
      <section
        ref={sectionRef}
        className="relative overflow-hidden bg-primary py-16 text-on-primary md:py-20 lg:py-24"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 55% at 12% 20%, color-mix(in srgb, var(--color-secondary) 65%, transparent), transparent 55%), radial-gradient(ellipse 55% 45% at 88% 85%, color-mix(in srgb, var(--color-secondary) 40%, transparent), transparent 50%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/55 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent"
          aria-hidden
        />
        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -left-[14%] top-[-6%] h-[88%] w-[46%] text-secondary opacity-45 max-lg:hidden"
        />
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-14 bottom-[-8%] h-64 w-64 text-secondary opacity-45 md:h-80 md:w-80"
        />

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="reveal grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-10">
            <div className="flex flex-col justify-center lg:col-span-3 lg:pr-2">
              <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                {bannerEyebrow}
              </p>

              <div className="mt-5 flex items-center gap-4" aria-hidden>
                <span className="h-px w-14 bg-secondary" />
                <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
                <span className="h-px w-8 bg-secondary/50" />
              </div>

              {bannerTitle ? (
                <h2 className="mt-6 m-0 font-headline-lg text-[clamp(1.55rem,2.6vw,2.15rem)] font-light leading-[1.2] tracking-[0.01em] text-on-primary">
                  {bannerTitle}
                </h2>
              ) : null}

              {bannerDescription ? (
                <p className="mt-5 m-0 max-w-sm font-body-md text-[14px] font-light leading-[1.85] text-on-primary/75 md:text-[15px]">
                  {bannerDescription}
                </p>
              ) : null}

              {bannerPhone ? (
                <a
                  href={`tel:${bannerPhone.replace(/\s/g, '')}`}
                  className="mt-8 inline-flex max-w-full items-center gap-3 rounded-md border border-secondary/40 bg-on-primary/5 px-3.5 py-3 transition-colors hover:border-secondary hover:bg-on-primary/10"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-secondary/45 text-secondary">
                    <Phone size={16} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-label-nav text-[10px] uppercase tracking-[0.22em] text-secondary/90">
                      {translatedCallPrefix}
                    </span>
                    <span className="mt-0.5 block truncate font-body-md text-[14px] font-medium text-on-primary md:text-[15px]">
                      {bannerPhone}
                    </span>
                  </span>
                </a>
              ) : null}
            </div>

            {formData ? (
              <div className="min-w-0 lg:col-span-9">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
                    aria-hidden
                  />
                  <div className="contact-form-editorial relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-5 py-7 shadow-[0_28px_60px_-28px_rgba(0,0,0,0.35)] sm:px-7 sm:py-8 md:rounded-[1.55rem] md:px-9 md:py-10">
                    <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                    <DecorativeVectors
                      variant="grid"
                      className="pointer-events-none -right-[8%] -top-[10%] h-[55%] w-[42%] opacity-70 max-sm:hidden"
                    />
                    <DecorativeVectors
                      variant="rings"
                      tone="whisper"
                      className="pointer-events-none -bottom-16 -left-12 h-44 w-44 opacity-30 max-md:hidden"
                    />
                    <div className="relative">
                      <ContactForm
                        form={formData}
                        hideHeading
                        trustNote={bannerTrust}
                        enableResubmit={enableResubmit}
                        resubmitButtonLabel={hasResubmitLabel ? translatedResubmitLabel : null}
                        successTitle={hasSuccessTitle ? translatedSuccessTitle : null}
                        successSubtitle={hasSuccessSubtitle ? translatedSuccessSubtitle : null}
                        submitLabelOverride={bannerSubmit}
                        variant="inquiryBanner"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
      </div>

      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="-left-[16%] top-[8%] h-[62%] w-[44%] max-lg:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="-right-20 top-16 h-72 w-72 md:-right-12 md:top-20 md:h-96 md:w-96"
      />

      <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-start gap-12 px-margin-mobile md:gap-14 md:px-margin-desktop lg:grid-cols-12 lg:gap-16">
        {officeList.length > 0 ? (
          <div className="reveal order-2 flex flex-col gap-8 lg:order-1 lg:col-span-5 lg:pt-2">
            {officeList.map((office, i) => (
              <article key={office.id || i} className="relative">
                {i > 0 ? (
                  <div
                    className="mb-8 h-px w-full bg-gradient-to-r from-secondary/40 via-secondary/15 to-transparent"
                    aria-hidden
                  />
                ) : null}

                <div className="flex items-start justify-between gap-4">
                  {office.label ? (
                    <span className="font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                      {office.label}
                    </span>
                  ) : null}
                  <MapPin className="shrink-0 text-secondary" size={18} strokeWidth={1.6} />
                </div>

                {office.city ? (
                  <h3 className="mt-3 m-0 font-headline-lg text-[clamp(1.55rem,2.6vw,2.1rem)] font-light leading-[1.2] tracking-[0.01em] text-primary">
                    {office.city}
                  </h3>
                ) : null}

                <div className="mt-5 h-px w-12 bg-secondary" aria-hidden />

                {office.addressLines && office.addressLines.length > 0 ? (
                  <div className="mt-5 space-y-1 font-body-lg text-[15px] font-light leading-[1.75] text-on-surface/70 md:text-[16px]">
                    {office.addressLines.map((line, lineIndex) =>
                      line?.line ? <p key={line.id || lineIndex} className="m-0">{line.line}</p> : null,
                    )}
                  </div>
                ) : null}

                {(office.phone || office.email) && (
                  <div className="mt-6 flex flex-col gap-2.5">
                    {office.phone ? (
                      <a
                        className="inline-flex w-fit items-center gap-2.5 font-body-md text-[15px] text-primary transition-colors hover:text-secondary"
                        href={`tel:${office.phone.replace(/\s/g, '')}`}
                      >
                        <Phone size={15} className="shrink-0 text-secondary" strokeWidth={1.6} />
                        {office.phone}
                      </a>
                    ) : null}
                    {office.email ? (
                      <a
                        className="inline-flex w-fit items-center gap-2.5 font-body-md text-[15px] text-primary transition-colors hover:text-secondary"
                        href={`mailto:${office.email}`}
                      >
                        <Mail size={15} className="shrink-0 text-secondary" strokeWidth={1.6} />
                        {office.email}
                      </a>
                    ) : null}
                  </div>
                )}

                {typeof office.image === 'object' && office.image !== null ? (
                  <div className="relative mt-8">
                    <div
                      className="absolute -right-2 -top-2 h-[94%] w-[94%] rounded-[1.5rem] border border-secondary/35 md:-right-3 md:-top-3 md:rounded-[1.75rem]"
                      aria-hidden
                    />
                    <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_22px_48px_-22px_rgba(0,0,0,0.35)] md:rounded-[1.75rem]">
                      <div className="relative aspect-[16/11] w-full sm:aspect-[16/10]">
                        <Media resource={office.image} fill imgClassName="object-cover" />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"
                          aria-hidden
                        />
                      </div>
                      <span
                        className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-secondary md:left-5 md:top-5 md:h-9 md:w-9"
                        aria-hidden
                      />
                      <span
                        className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-secondary md:right-5 md:top-5 md:h-9 md:w-9"
                        aria-hidden
                      />
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {formData ? (
          <div
            className={`reveal delay-150 order-1 lg:order-2 ${officeList.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12 lg:mx-auto lg:max-w-3xl'}`}
          >
            <div className="contact-form-editorial relative overflow-hidden rounded-[1.75rem] bg-surface-cream px-6 py-8 shadow-[0_28px_60px_-32px_rgba(0,0,0,0.28)] md:rounded-[2rem] md:px-10 md:py-11 lg:px-12 lg:py-12">
              <DecorativeVectors
                variant="grid"
                className="-right-[10%] -top-[8%] h-[55%] w-[45%] opacity-70 max-sm:hidden"
              />
              <div className="relative">
                <ContactForm
                  description={hasDescription ? translatedDescription : null}
                  eyebrow={hasEyebrow ? translatedEyebrow : null}
                  form={formData}
                  heading={hasTitle ? translatedTitle : null}
                  submitLabelOverride={hasSubmitOverride ? translatedSubmitLabel : null}
                  trustNote={hasTrustNote ? translatedTrustNote : null}
                  enableResubmit={enableResubmit}
                  resubmitButtonLabel={hasResubmitLabel ? translatedResubmitLabel : null}
                  successTitle={hasSuccessTitle ? translatedSuccessTitle : null}
                  successSubtitle={hasSuccessSubtitle ? translatedSuccessSubtitle : null}
                  variant="editorial"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
