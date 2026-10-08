'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import { X } from 'lucide-react'
import React, { useEffect, useMemo } from 'react'

import { ContactForm } from '@/blocks/ContactSectionBlock/ContactForm'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import type { Form } from '@/payload-types'
import {
  buildDocumentDownloadCrmMessage,
  buildDocumentDownloadHiddenFields,
  documentDownloadOmitFields,
  resolveDownloadMessageFieldName,
  type DocumentDownloadRequest,
} from '@/utilities/documentDownload'
import { buildPropertyInquiryHiddenFields, type PropertyInquiryContext } from '@/utilities/propertyInquiry'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  open: boolean
  request: DocumentDownloadRequest | null
  onClose: () => void
  contactForm?: Form | null
  heroImageUrl?: string
  inquiry: PropertyInquiryContext
}

export const DocumentDownloadModal: React.FC<Props> = ({
  open,
  request,
  onClose,
  contactForm,
  heroImageUrl,
  inquiry,
}) => {
  const pdfTitle = useTranslation('downloadRequest.pdf.title', 'Download PDF')
  const pdfDescription = useTranslation(
    'downloadRequest.pdf.description',
    'Enter your details to receive the PDF download link by email.',
  )
  const planTitle = useTranslation('downloadRequest.plan.title', 'Download plan')
  const planDescription = useTranslation(
    'downloadRequest.plan.description',
    'Enter your details to receive the plan download link by email.',
  )
  const documentTitlePrefix = useTranslation('downloadRequest.document.titlePrefix', 'Download')
  const documentDescription = useTranslation(
    'downloadRequest.document.description',
    'Enter your details to receive this document by email.',
  )
  const pdfSuccessSubtitle = useTranslation(
    'downloadRequest.pdf.successSubtitle',
    'We sent the PDF download link to your email address.',
  )
  const planSuccessSubtitle = useTranslation(
    'downloadRequest.plan.successSubtitle',
    'We sent the plan download link to your email address.',
  )
  const documentSuccessSubtitle = useTranslation(
    'downloadRequest.successSubtitle',
    'We sent the download link to your email address.',
  )
  const closeAriaLabel = useTranslation('downloadRequest.closeAria', 'Close')
  const closeBackdropAria = useTranslation('downloadRequest.closeBackdropAria', 'Close download form')
  const formNotConfigured = useTranslation(
    'propertyDetail.inquiry.formNotConfigured',
    'Contact form is not configured. Add a form titled "Contact Form" in the admin panel.',
  )
  const submitLabel = useTranslation('downloadRequest.submit', 'Submit')
  const successTitle = useTranslation('downloadRequest.successTitle', 'Request received')
  const trustNote = useTranslation(
    'propertyDetail.inquiry.trustNote',
    'By clicking submit, you agree to our privacy policy and terms.',
  )
  const lead = useTranslation(
    'downloadRequest.message.lead',
    'This user has requested to download this document.',
  )
  const actionLabel = useTranslation('downloadRequest.message.action', 'Action')
  const documentLabel = useTranslation('downloadRequest.message.document', 'Document')
  const urlLabel = useTranslation('downloadRequest.message.url', 'URL')
  const pageLabel = useTranslation('downloadRequest.message.page', 'Page')

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const hiddenFields = useMemo(() => {
    if (!request) return undefined

    const message = buildDocumentDownloadCrmMessage({
      lead,
      actionLabel,
      action: request.actionLabel,
      documentLabel,
      document: request.documentLabel,
      urlLabel,
      url: request.url,
      pageLabel,
      pageUrl: request.pageUrl,
    })

    const entries = [
      ...buildPropertyInquiryHiddenFields(inquiry),
      ...buildDocumentDownloadHiddenFields({
        messageFieldName: resolveDownloadMessageFieldName(contactForm),
        message,
        request,
        heroImageUrl,
      }),
    ]

    return Object.fromEntries(entries.map(({ field, value }) => [field, value]))
  }, [
    actionLabel,
    contactForm,
    documentLabel,
    heroImageUrl,
    inquiry,
    lead,
    pageLabel,
    request,
    urlLabel,
  ])

  const omitFields = useMemo(() => documentDownloadOmitFields(contactForm), [contactForm])

  const kind = request?.kind ?? 'document'
  const title =
    kind === 'pdf'
      ? pdfTitle
      : kind === 'plan'
        ? planTitle
        : `${documentTitlePrefix} ${request?.documentLabel ?? ''}`.trim()
  const description =
    kind === 'pdf' ? pdfDescription : kind === 'plan' ? planDescription : documentDescription
  const successSubtitle =
    kind === 'pdf'
      ? pdfSuccessSubtitle
      : kind === 'plan'
        ? planSuccessSubtitle
        : documentSuccessSubtitle

  if (!open || !request) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-download-title"
    >
      <button
        type="button"
        aria-label={closeBackdropAria}
        className="fixed inset-0 bg-black/55"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[min(92vh,860px)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-secondary/30 bg-surface-cream shadow-[0_28px_60px_-32px_rgba(0,0,0,0.28)] md:rounded-[2rem]">
        <DecorativeVectors
          variant="rings"
          tone="whisper"
          className="-right-16 -top-20 h-56 w-56 opacity-70"
        />
        <DecorativeVectors
          variant="grid"
          className="-bottom-16 -left-10 h-48 w-48 opacity-50"
        />

        <div className="relative flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="min-w-0">
            <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
            <h2
              id="document-download-title"
              className="m-0 font-headline-lg text-[clamp(1.65rem,2.4vw,2.15rem)] font-light leading-tight tracking-[0.01em] text-primary"
            >
              {title}
            </h2>
            <p className="mt-3 max-w-lg font-body-md text-[15px] font-light leading-relaxed text-on-surface/70">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant/40 text-primary transition-colors hover:border-secondary hover:bg-secondary hover:text-on-secondary"
            aria-label={closeAriaLabel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 sm:px-8 sm:pb-8">
          {!contactForm ? (
            <p className="font-body-md text-body-md text-on-surface-variant">{formNotConfigured}</p>
          ) : (
            <ContactForm
              key={`${request.kind}-${request.url}-${request.actionLabel}-${request.documentLabel}`}
              form={contactForm as unknown as FormType}
              formDomId={`document-download-${contactForm.id}`}
              hiddenFields={hiddenFields}
              hideConfirmationMessage
              hideHeading
              omitFields={omitFields}
              optionalPhone
              pairedFields
              submitLabelOverride={submitLabel}
              variant="editorial"
              successSubtitle={successSubtitle}
              successTitle={successTitle}
              trustNote={trustNote}
            />
          )}
        </div>
      </div>
    </div>
  )
}
