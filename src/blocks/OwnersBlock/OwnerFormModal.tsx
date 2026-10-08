'use client'

import { X } from 'lucide-react'
import React, { useEffect, useId, useRef, useState } from 'react'

import { ContactForm } from '@/blocks/ContactSectionBlock/ContactForm'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { useTranslation } from '@/utilities/translateClient'

import type { OwnerFormSettings } from './ownerFormSettings'

type Props = {
  formDomId: string
  onClose: () => void
  settings: OwnerFormSettings
  /** Hides the Rent / Sale choice and submits this intent. */
  fixedOwnerIntent?: 'rent' | 'sale'
  /** Heading used before a Rent / Sale choice, such as the homepage card title. */
  fallbackTitle?: string | null
}

export const OwnerFormModal: React.FC<Props> = ({
  formDomId,
  onClose,
  settings,
  fixedOwnerIntent,
  fallbackTitle,
}) => {
  const titleId = useId()
  const closeLabel = useTranslation('owners.modal.close', 'Close')
  const closeBackdropLabel = useTranslation('owners.modal.closeBackdrop', 'Close owner form')
  const sellTitle = useTranslation('owners.modal.sellTitle', 'Sell your property')
  const rentTitle = useTranslation('owners.modal.rentTitle', 'Rent your property')
  const sellDescription = useTranslation(
    'owners.modal.sellDescription',
    'Enter your details and we will be in touch about selling your property.',
  )
  const rentDescription = useTranslation(
    'owners.modal.rentDescription',
    'Enter your details and we will be in touch about renting out your property.',
  )
  const defaultSubmit = useTranslation('owners.modal.submit', 'Submit')
  const defaultTrust = useTranslation(
    'owners.modal.trustNote',
    'By clicking submit, you agree to our privacy policy and terms.',
  )
  const [chosenIntent, setChosenIntent] = useState<'rent' | 'sale' | ''>(fixedOwnerIntent ?? '')
  const intent = fixedOwnerIntent ?? chosenIntent
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const title =
    intent === 'rent'
      ? rentTitle
      : intent === 'sale'
        ? sellTitle
        : fallbackTitle?.trim() || sellTitle
  const description = fixedOwnerIntent === 'rent' ? rentDescription : sellDescription
  const trustNote = settings.trustNote?.trim() || defaultTrust
  const submitLabel = settings.submitLabelOverride?.trim() || defaultSubmit
  const resubmitLabel = settings.resubmitButtonLabel?.trim() || null
  const successHeading = settings.successTitle?.trim() || null
  const successText = settings.successSubtitle?.trim() || null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={closeBackdropLabel}
        className="fixed inset-0 bg-black/55"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[min(92vh,860px)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-secondary/30 bg-surface-cream shadow-[0_28px_60px_-32px_rgba(0,0,0,0.28)] md:rounded-[2rem]">
        <DecorativeVectors
          variant="rings"
          tone="whisper"
          className="-right-16 -top-20 h-56 w-56 opacity-70"
        />
        <DecorativeVectors variant="grid" className="-bottom-16 -left-10 h-48 w-48 opacity-50" />

        <div className="relative flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="min-w-0">
            <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
            <h2
              id={titleId}
              className="m-0 font-headline-lg text-[clamp(1.65rem,2.4vw,2.15rem)] font-light leading-tight tracking-[0.01em] text-primary"
            >
              {title}
            </h2>
            {fixedOwnerIntent ? (
              <p className="mt-3 max-w-lg font-body-md text-[15px] font-light leading-relaxed text-on-surface/70">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant/40 text-primary transition-colors hover:border-secondary hover:bg-secondary hover:text-on-secondary"
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-6 sm:px-8 sm:pb-8">
          <ContactForm
            crmTarget="owner"
            enableResubmit={settings.enableResubmit}
            fixedOwnerIntent={fixedOwnerIntent}
            form={settings.form}
            formDomId={formDomId}
            hideConfirmationMessage
            hideHeading
            onOwnerIntentChange={fixedOwnerIntent ? undefined : setChosenIntent}
            pairedFields
            resubmitButtonLabel={resubmitLabel}
            submitLabelOverride={submitLabel}
            successSubtitle={successText}
            successTitle={successHeading}
            trustNote={trustNote}
            variant="editorial"
          />
        </div>
      </div>
    </div>
  )
}
