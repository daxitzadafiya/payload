'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import { X } from 'lucide-react'
import React, { useEffect, useMemo } from 'react'

import { ContactForm } from '@/blocks/ContactSectionBlock/ContactForm'
import type { Form } from '@/payload-types'
import type { CRMListingPreset, PropertyListFilters } from '@/utilities/crmProperties'
import {
  buildSaveSearchHiddenFields,
  SAVE_SEARCH_OMIT_FORM_FIELDS,
  type SaveSearchLabelMaps,
} from '@/utilities/saveSearch'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  open: boolean
  onClose: () => void
  contactForm?: Form | null
  filters: PropertyListFilters
  listingPreset: CRMListingPreset
  labelMaps?: SaveSearchLabelMaps
}

export const PropertyListSaveSearchModal: React.FC<Props> = ({
  open,
  onClose,
  contactForm,
  filters,
  listingPreset,
  labelMaps,
}) => {
  const title = useTranslation('propertyList.saveSearch.title', 'Save search')
  const description = useTranslation(
    'propertyList.saveSearch.description',
    'You will receive notifications of new listings that match your criteria.',
  )
  const closeAriaLabel = useTranslation('propertyList.saveSearch.closeAria', 'Close')
  const closeBackdropAria = useTranslation(
    'propertyList.saveSearch.closeBackdropAria',
    'Close save search',
  )
  const formNotConfigured = useTranslation(
    'propertyList.saveSearch.formNotConfigured',
    'Contact form is not configured. Add a form titled "Contact" in the admin panel.',
  )
  const submitLabel = useTranslation('propertyList.saveSearch.submit', 'Save search')
  const successTitle = useTranslation('propertyList.saveSearch.successTitle', 'Search saved')
  const successSubtitle = useTranslation(
    'propertyList.saveSearch.successSubtitle',
    'Thank you. Our team will notify you when matching properties become available.',
  )
  const trustNote = useTranslation(
    'propertyList.saveSearch.trustNote',
    'By clicking submit, you agree to our privacy policy and terms.',
  )
  const resubmitButtonLabel = useTranslation(
    'propertyList.saveSearch.resubmitButton',
    'Save another search',
  )

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
    const entries = buildSaveSearchHiddenFields(filters, listingPreset, labelMaps)
    return Object.fromEntries(entries.map(({ field, value }) => [field, value]))
  }, [filters, labelMaps, listingPreset])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-search-title"
    >
      <button
        type="button"
        aria-label={closeBackdropAria}
        className="fixed inset-0 bg-black/55"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3 md:px-5">
          <h2 id="save-search-title" className="font-headline-sm text-headline-sm text-on-surface">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            aria-label={closeAriaLabel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 md:px-5 md:py-4">
          {!contactForm ? (
            <p className="font-body-md text-body-md text-on-surface-variant">{formNotConfigured}</p>
          ) : (
            <ContactForm
              compact
              description={description}
              enableResubmit
              form={contactForm as unknown as FormType}
              hiddenFields={hiddenFields}
              hideConfirmationMessage
              hideHeading
              omitFields={[...SAVE_SEARCH_OMIT_FORM_FIELDS]}
              resubmitButtonLabel={resubmitButtonLabel}
              singleColumn
              submitLabelOverride={submitLabel}
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
