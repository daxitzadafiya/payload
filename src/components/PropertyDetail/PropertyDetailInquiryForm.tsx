'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import React, { useMemo } from 'react'

import { ContactForm } from '@/blocks/ContactSectionBlock/ContactForm'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import type { Form } from '@/payload-types'
import {
  buildPropertyInquiryHiddenFields,
  type PropertyInquiryContext,
} from '@/utilities/propertyInquiry'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  contactForm?: Form | null
  inquiry: PropertyInquiryContext
  propertyTitle: string
}

const DEFAULT_MESSAGE_KEY = 'propertyDetail.inquiry.defaultMessage'
const DEFAULT_MESSAGE_FALLBACK =
  "Hello, I'm interested in this property and would like to visit it.\nThank you."
const PROJECT_MESSAGE_KEY = 'propertyDetail.inquiry.defaultMessage.project'
const PROJECT_MESSAGE_FALLBACK =
  "Hello, I'm interested in this project and would like to visit it.\nThank you."

function resolveMessageFieldName(form: Form): string | undefined {
  for (const field of form.fields ?? []) {
    if (
      field &&
      typeof field === 'object' &&
      'blockType' in field &&
      field.blockType === 'textarea' &&
      'name' in field &&
      typeof field.name === 'string'
    ) {
      return field.name
    }
  }

  return undefined
}

const panelClassName =
  'contact-form-editorial relative sticky top-32 overflow-hidden rounded-[1.75rem] border border-secondary/30 bg-surface-cream p-6 shadow-[0_28px_60px_-32px_rgba(0,0,0,0.28)] sm:p-8 md:rounded-[2rem]'

export const PropertyDetailInquiryForm: React.FC<Props> = ({
  contactForm,
  inquiry,
  propertyTitle,
}) => {
  const isProject = inquiry.kind === 'project'
  const propertyDefaultMessage = useTranslation(DEFAULT_MESSAGE_KEY, DEFAULT_MESSAGE_FALLBACK)
  const projectDefaultMessage = useTranslation(PROJECT_MESSAGE_KEY, PROJECT_MESSAGE_FALLBACK)
  const defaultMessage = isProject ? projectDefaultMessage : propertyDefaultMessage
  const formNotConfigured = useTranslation(
    'propertyDetail.inquiry.formNotConfigured',
    'Contact form is not configured. Add a form titled "Contact Form" in the admin panel.',
  )
  const propertyHeading = useTranslation(
    'propertyDetail.inquiry.heading-property-inquiry',
    'Property Inquiry',
  )
  const projectHeading = useTranslation(
    'propertyDetail.inquiry.heading-project-inquiry',
    'Project Inquiry',
  )
  const heading = isProject ? projectHeading : propertyHeading
  const resubmitButtonLabel = useTranslation(
    'propertyDetail.inquiry.resubmitButton',
    'Send another inquiry',
  )
  const submitLabel = useTranslation('propertyDetail.inquiry.submit', 'Submit Request')
  const successTitle = useTranslation('propertyDetail.inquiry.successTitle', 'Request Received')
  const successSubtitlePrefix = useTranslation(
    'propertyDetail.inquiry.successSubtitlePrefix',
    'Our team will contact you shortly about',
  )
  const successThanks = useTranslation(
    'propertyDetail.inquiry.successThanks',
    'Thanks for connecting',
  )
  const trustNote = useTranslation(
    'propertyDetail.inquiry.trustNote',
    'By clicking submit, you agree to our privacy policy and terms.',
  )

  const hiddenFields = useMemo(() => {
    const entries = buildPropertyInquiryHiddenFields(inquiry)
    return Object.fromEntries(entries.map(({ field, value }) => [field, value]))
  }, [inquiry])

  const defaultFieldValues = useMemo(() => {
    if (!contactForm) return undefined

    const messageFieldName = resolveMessageFieldName(contactForm)
    if (!messageFieldName) return undefined

    return { [messageFieldName]: defaultMessage }
  }, [contactForm, defaultMessage])

  if (!contactForm) {
    return (
      <div className={panelClassName}>
        <p className="font-body-md text-on-surface/70">{formNotConfigured}</p>
      </div>
    )
  }

  return (
    <div className={panelClassName} id="property-inquiry-form">
      <DecorativeVectors
        variant="grid"
        className="-right-[12%] -top-[10%] h-[50%] w-[45%] opacity-60 max-sm:hidden"
      />
      <div className="relative">
        <ContactForm
          defaultFieldValues={defaultFieldValues}
          enableResubmit
          form={contactForm as unknown as FormType}
          heading={heading}
          hiddenFields={hiddenFields}
          hideConfirmationMessage
          resubmitButtonLabel={resubmitButtonLabel}
          singleColumn
          submitLabelOverride={submitLabel}
          successSubtitle={`${successSubtitlePrefix} ${propertyTitle}.`}
          successThanks={successThanks}
          successTitle={successTitle}
          trustNote={trustNote}
          variant="editorial"
        />
      </div>
    </div>
  )
}
