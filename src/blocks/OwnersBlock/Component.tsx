'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import { ArrowRight, Eye, ShieldCheck, UserRound, Users } from 'lucide-react'
import React, { useState } from 'react'

import { Media } from '@/components/Media'
import type { Page } from '@/payload-types'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'

import { OwnerFormModal } from './OwnerFormModal'

type Props = Extract<Page['layout'][0], { blockType: 'ownersBlock' }>

export const OwnersBlock: React.FC<Props> = ({
  formEyebrow,
  formTitle,
  formDescription,
  ctaLabel,
  image,
  submitLabelOverride,
  formTrustNote,
  enableResubmit,
  resubmitButtonLabel,
  successTitle,
  successSubtitle,
  form,
}) => {
  const formData = typeof form === 'object' && form !== null ? (form as unknown as FormType) : null
  const sectionRef = useReveal()
  const [open, setOpen] = useState(false)

  const eyebrow = formEyebrow?.trim() || 'For Owners'
  const title = formTitle?.trim() || 'List Your Property with Zariko'
  const description =
    formDescription?.trim() ||
    "Whether you want to rent or sell your property, we'll help you get the best exposure and connect you with the right buyers or tenants. Our team provides expert guidance and full support throughout the process."
  const buttonLabel = ctaLabel?.trim() || 'Create owner'
  const trustNote = formTrustNote?.trim() || ''
  const submitLabel = submitLabelOverride?.trim() || null
  const resubmitLabel = resubmitButtonLabel?.trim() || null
  const successHeading = successTitle?.trim() || null
  const successText = successSubtitle?.trim() || null
  const hasImage = typeof image === 'object' && image !== null

  const trustedLabel = useTranslation('owners.trust.secure', 'Trusted & Secure')
  const supportLabel = useTranslation('owners.trust.support', 'Expert Support')
  const exposureLabel = useTranslation('owners.trust.exposure', 'Maximum Exposure')

  return (
    <section ref={sectionRef} className="bg-surface py-10 md:py-14 lg:py-16">
      <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="reveal relative overflow-hidden rounded-[1.75rem] bg-surface-container-low px-6 py-8 shadow-[0_24px_50px_-36px_rgba(0,0,0,0.35)] md:px-10 md:py-10 lg:px-12 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className={hasImage ? 'lg:col-span-6' : 'lg:col-span-12 lg:max-w-2xl'}>
              <span className="block h-px w-10 bg-secondary" aria-hidden />
              <p className="mt-5 font-headline-md text-[clamp(1.75rem,3vw,2.4rem)] font-medium leading-tight text-primary">
                {eyebrow}
              </p>
              <h2 className="mt-2 font-headline-lg text-[clamp(1.35rem,2.4vw,1.85rem)] font-light leading-snug text-on-surface">
                {title}
              </h2>
              <p className="mt-4 max-w-xl font-body-md text-[15px] font-light leading-[1.8] text-on-surface/70 md:text-[16px]">
                {description}
              </p>

              {formData ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-secondary bg-secondary px-5 py-3 font-label-nav text-[12px] uppercase tracking-[0.14em] text-on-secondary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary"
                >
                  <UserRound size={16} aria-hidden />
                  {buttonLabel}
                  <ArrowRight size={16} aria-hidden />
                </button>
              ) : null}

              <ul className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                {(
                  [
                    { icon: ShieldCheck, label: trustedLabel },
                    { icon: Users, label: supportLabel },
                    { icon: Eye, label: exposureLabel },
                  ] as const
                ).map((item) => (
                  <li
                    key={item.label}
                    className="inline-flex items-center gap-2 font-body-sm text-[13px] text-primary/80"
                  >
                    <item.icon size={16} className="shrink-0 text-secondary" aria-hidden />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            {hasImage ? (
              <div className="relative lg:col-span-6">
                <div
                  className="absolute -right-3 top-6 hidden h-[88%] w-[92%] rounded-[1.5rem] bg-secondary/15 md:block"
                  aria-hidden
                />
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[1.35rem] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]">
                  <Media
                    className="absolute inset-0"
                    fill
                    imgClassName="object-cover"
                    pictureClassName="absolute inset-0"
                    resource={image}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {open && formData ? (
        <OwnerFormModal
          fallbackTitle={title}
          formDomId={`owners-${formData.id}`}
          onClose={() => setOpen(false)}
          settings={{
            form: formData,
            enableResubmit,
            resubmitButtonLabel: resubmitLabel,
            submitLabelOverride: submitLabel,
            successSubtitle: successText,
            successTitle: successHeading,
            trustNote,
          }}
        />
      ) : null}
    </section>
  )
}
