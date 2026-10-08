'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import { AlertCircle, Check, CircleArrowRight, Loader2, Lock } from 'lucide-react'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'

import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import RichText from '@/components/RichText'
import { RecaptchaWidget } from '@/components/RecaptchaWidget/RecaptchaWidget'
import { fields as defaultFields } from '@/blocks/Form/fields'
import { useFormSubmission } from '@/blocks/Form/useFormSubmission'

import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'
import { useSiteLocale } from '@/utilities/useSiteLocale'

import { contactFields } from './contactFields'
import { formatPhoneE164, isValidPhoneValue } from '@/utilities/phoneValidation'

type HiddenFieldValue = string | boolean

type Props = {
  form: FormType
  eyebrow?: string | null
  heading?: string | null
  description?: string | null
  trustNote?: string | null
  submitLabelOverride?: string | null
  enableResubmit?: boolean | null
  resubmitButtonLabel?: string | null
  successTitle?: string | null
  successSubtitle?: string | null
  successThanks?: string | null
  /** Merged into the submission payload (e.g. property inquiry CRM fields). */
  hiddenFields?: Record<string, HiddenFieldValue>
  /** Overrides default values for visible form fields by field name. */
  defaultFieldValues?: Record<string, string>
  /** Stack all fields in a single column (property detail sidebar). */
  singleColumn?: boolean
  /** Field names to skip rendering (still send via hiddenFields if provided). */
  omitFields?: string[]
  /** Phone stays optional even when the CMS form marks it required. */
  optionalPhone?: boolean
  /** DOM id for this form. Required when more than one copy is on the page. */
  formDomId?: string
  /** First/last name and email/phone sit side by side. */
  pairedFields?: boolean
  /** Hide the form title/heading (e.g. when the parent modal already has one). */
  hideHeading?: boolean
  /** Skip the form's confirmationMessage rich text (avoids duplicating custom success copy). */
  hideConfirmationMessage?: boolean
  /** Tighter spacing for modal layouts. */
  compact?: boolean
  /** Full-page contact layout — left-aligned headings, Template Two styling. */
  variant?: 'default' | 'editorial' | 'inquiryBanner'
  /**
   * `account` creates an Optima account (Contact Us).
   * `owner` creates an Optima owner and requires a Rent / Sale choice.
   */
  crmTarget?: 'account' | 'owner'
  /**
   * Owner forms opened from Sell / Rent pages. Hides the Rent / Sale choice
   * and submits this intent.
   */
  fixedOwnerIntent?: 'rent' | 'sale' | null
  /** Fired when the visitor picks Rent or Sale on an owner form. */
  onOwnerIntentChange?: (intent: 'rent' | 'sale' | '') => void
}

export const ContactForm: React.FC<Props> = ({
  form: formFromProps,
  eyebrow,
  heading,
  description,
  trustNote,
  submitLabelOverride,
  enableResubmit,
  resubmitButtonLabel,
  successTitle,
  successSubtitle,
  successThanks,
  hiddenFields,
  defaultFieldValues,
  singleColumn = false,
  omitFields,
  optionalPhone = false,
  formDomId,
  pairedFields = false,
  hideHeading = false,
  hideConfirmationMessage = false,
  compact = false,
  variant = 'default',
  crmTarget = 'account',
  fixedOwnerIntent = null,
  onOwnerIntentChange,
}) => {
  const {
    id: formID,
    title: formTitle,
    confirmationMessage,
    confirmationType,
    submitButtonLabel,
    fields: formFields,
  } = formFromProps

  const formElementId = formDomId?.trim() || String(formID)

  const { settings: integrations } = useIntegrationsSettings()
  const recaptchaSiteKey = integrations.recaptchaSiteKey
  const recaptchaConfigured = Boolean(recaptchaSiteKey)
  const locale = useSiteLocale()
  const deferredLocale = useDeferredSiteLocale()
  const recaptchaRequiredMessage = useTranslation(
    'form.validation.recaptcha.hint',
    'Please verify you are not a robot.',
  )
  const submittingLabel = useTranslation('form.submit.submitting', 'Submitting…')
  const translatedFormTitle = useTranslation('form.title.contact', formTitle || 'Contact Form')
  const translatedSubmitLabel = useTranslation(
    'form.submit.connectNow',
    submitButtonLabel || 'Connect now',
  )
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaLoadError, setRecaptchaLoadError] = useState<string | null>(null)
  const [recaptchaValidationError, setRecaptchaValidationError] = useState<string | null>(null)
  const [recaptchaResetKey, setRecaptchaResetKey] = useState(0)
  const [ownerIntent, setOwnerIntent] = useState<'rent' | 'sale' | ''>('')
  const [ownerIntentError, setOwnerIntentError] = useState<string | null>(null)
  const isOwnerForm = crmTarget === 'owner'
  const lockedOwnerIntent =
    fixedOwnerIntent === 'rent' || fixedOwnerIntent === 'sale' ? fixedOwnerIntent : null
  const showOwnerIntent = isOwnerForm && !lockedOwnerIntent
  const ownerIntentLegend = useTranslation('owners.intent.legend', 'I want to')
  const ownerRentLabel = useTranslation('owners.intent.rent', 'Rent')
  const ownerSaleLabel = useTranslation('owners.intent.sale', 'Sale')
  const ownerIntentRequiredMessage = useTranslation(
    'owners.intent.required',
    'Please choose Rent or Sale.',
  )
  const ownerRentHint = useTranslation('owners.intent.rentHint', 'Rent out my property')
  const ownerSaleHint = useTranslation('owners.intent.saleHint', 'Sell my property')

  const formMethods = useForm<any>({
    defaultValues: formFields as any,
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const extraSubmissionFields = hiddenFields
    ? Object.entries(hiddenFields).map(([field, value]) => ({ field, value }))
    : undefined

  const { isLoading, hasSubmitted, error, onSubmit, resetSubmission } = useFormSubmission(
    formFromProps,
    {
      syncToOptimaCrm: !isOwnerForm,
      syncToOptimaOwners: isOwnerForm,
      recaptchaRequired: recaptchaConfigured,
      recaptchaToken,
      extraSubmissionFields,
    },
  )

  useEffect(() => {
    if (hasSubmitted) {
      formMethods.reset({})
      setRecaptchaToken('')
      setRecaptchaLoadError(null)
      setRecaptchaValidationError(null)
    }
  }, [hasSubmitted, formMethods])

  const resetSubmissionWithRecaptcha = () => {
    setRecaptchaToken('')
    setRecaptchaValidationError(null)
    setRecaptchaResetKey((key) => key + 1)
    formMethods.reset(defaultFieldValues ?? {})
    setOwnerIntent('')
    setOwnerIntentError(null)
    onOwnerIntentChange?.('')
    resetSubmission()
  }

  const handleContactSubmit = (data: any) => {
    if (isLoading) return

    const resolvedOwnerIntent = lockedOwnerIntent ?? ownerIntent
    if (isOwnerForm && resolvedOwnerIntent !== 'rent' && resolvedOwnerIntent !== 'sale') {
      setOwnerIntentError(ownerIntentRequiredMessage)
      return
    }

    if (recaptchaConfigured && !recaptchaToken) {
      setRecaptchaValidationError(recaptchaRequiredMessage)
      return
    }

    setRecaptchaValidationError(null)
    setOwnerIntentError(null)

    const normalizedData = { ...data }
    if (isOwnerForm && (resolvedOwnerIntent === 'rent' || resolvedOwnerIntent === 'sale')) {
      normalizedData.transaction_types = resolvedOwnerIntent
    }
    for (const [key, value] of Object.entries(normalizedData)) {
      if (typeof value !== 'string' || !/phone|mobile|tel/i.test(key)) continue
      const formatted = formatPhoneE164(value)
      if (optionalPhone) {
        if (formatted && isValidPhoneValue(formatted)) normalizedData[key] = formatted
        else delete normalizedData[key]
      } else {
        normalizedData[key] = formatted || value
      }
    }

    onSubmit(normalizedData)
  }

  const isEditorial = variant === 'editorial'
  const isInquiryBanner = variant === 'inquiryBanner'

  const renderField = (field: any, index: number, wrapperClass = '') => {
    const fieldName = 'name' in field ? field.name : undefined
    if (fieldName && omitFields?.includes(fieldName)) return null

    const fieldDefaultValue =
      fieldName && defaultFieldValues ? defaultFieldValues[fieldName] : undefined
    const phoneOptional =
      optionalPhone &&
      Boolean(fieldName) &&
      /phone|mobile|tel|cell|cellphone/i.test(
        `${fieldName} ${'label' in field && typeof field.label === 'string' ? field.label : ''}`,
      )
    const resolvedField = {
      ...field,
      ...(fieldDefaultValue != null ? { defaultValue: fieldDefaultValue } : {}),
      ...(phoneOptional ? { required: false } : {}),
    }
    const blockType = resolvedField.blockType as string
    const ContactField: React.FC<any> | undefined = (contactFields as any)[blockType]

    if (ContactField) {
      return (
        <div className={wrapperClass} key={index}>
          <ContactField
            {...resolvedField}
            control={control}
            domId={fieldName ? `${formElementId}-${fieldName}` : undefined}
            errors={errors}
            register={register}
          />
        </div>
      )
    }

    const DefaultField: React.FC<any> | undefined = (defaultFields as any)[blockType]
    if (DefaultField) {
      return (
        <div className={wrapperClass} key={index}>
          <DefaultField
            form={formFromProps}
            {...resolvedField}
            control={control}
            errors={errors}
            register={register}
          />
        </div>
      )
    }

    return null
  }

  const visibleFields = (formFields ?? []).filter((field) => {
    const fieldName = 'name' in field ? field.name : undefined
    return !(fieldName && omitFields?.includes(fieldName))
  })

  const primaryFields = visibleFields.filter((field) => {
    const blockType = field.blockType as string
    return blockType !== 'textarea' && blockType !== 'message' && blockType !== 'checkbox'
  })
  const messageFields = visibleFields.filter((field) => {
    const blockType = field.blockType as string
    return blockType === 'textarea' || blockType === 'message'
  })
  const checkboxFields = visibleFields.filter((field) => field.blockType === 'checkbox')

  const ownerIntentControl = showOwnerIntent ? (
    <fieldset
      className={`m-0 min-w-0 border-0 p-0 ${isInquiryBanner ? 'lg:col-span-12' : ''}`}
      disabled={isLoading}
    >
      <legend
        className="font-label-nav text-[11px] uppercase tracking-[0.16em] text-primary"
        id={`${formElementId}-intent-label`}
      >
        {ownerIntentLegend}
      </legend>
      <div
        aria-invalid={ownerIntentError ? true : undefined}
        aria-labelledby={`${formElementId}-intent-label`}
        aria-required="true"
        className="mt-3 grid grid-cols-2 gap-2"
        role="radiogroup"
      >
        {(
          [
            { value: 'rent' as const, label: ownerRentLabel, hint: ownerRentHint },
            { value: 'sale' as const, label: ownerSaleLabel, hint: ownerSaleHint },
          ] as const
        ).map((option) => {
          const selected = ownerIntent === option.value
          return (
            <label
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 py-3 text-center font-label-nav text-[11px] uppercase tracking-[0.16em] transition-colors ${
                selected
                  ? 'border-secondary bg-secondary text-on-secondary'
                  : 'border-outline-variant/70 bg-surface-container-lowest text-primary hover:border-secondary'
              } ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
              key={option.value}
            >
              <input
                checked={selected}
                className="sr-only"
                name={`${formElementId}-owner-intent`}
                onChange={() => {
                  setOwnerIntent(option.value)
                  setOwnerIntentError(null)
                  onOwnerIntentChange?.(option.value)
                }}
                type="radio"
                value={option.value}
              />
              <span>
                <span className="block">{option.label}</span>
                <span
                  className={`mt-1 block font-body-sm text-[11px] font-normal normal-case tracking-normal ${
                    selected ? 'text-on-secondary/80' : 'text-on-surface/55'
                  }`}
                >
                  {option.hint}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      {ownerIntentError ? (
        <p className="contact-field-error mt-2 text-sm" role="alert">
          {ownerIntentError}
        </p>
      ) : null}
    </fieldset>
  ) : null

  return (
    <FormProvider {...formMethods}>
      {!isLoading && hasSubmitted && confirmationType === 'message' && (
        <div
          className={
            compact
              ? 'relative overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-6'
              : 'relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-6 py-10 md:px-8 md:py-12'
          }
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-secondary/5 to-transparent" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-44 w-44 rounded-full border-22 border-secondary/10" />
          <div className="pointer-events-none absolute -left-16 -bottom-14 h-36 w-56 rounded-[100%] border border-secondary/10" />

          <div className="relative z-10 text-center">
            <div
              className={
                compact
                  ? 'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-sm'
                  : 'mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-sm'
              }
            >
              <Check size={compact ? 24 : 30} strokeWidth={2.5} />
            </div>

            {(successTitle || successSubtitle || successThanks) && (
              <div className="mx-auto max-w-md">
                {successTitle && (
                  <h3 className="font-headline-md text-headline-md text-primary">{successTitle}</h3>
                )}
                {successSubtitle && (
                  <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                    {successSubtitle}
                  </p>
                )}
                {successThanks && (
                  <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                    {successThanks}
                  </p>
                )}
              </div>
            )}

            {!hideConfirmationMessage && !successThanks && confirmationMessage && (
              <RichText
                className="mx-auto mt-3 max-w-md [&_h1]:font-headline-md [&_h1]:text-headline-md [&_h1]:text-primary [&_h2]:font-headline-md [&_h2]:text-headline-md [&_h2]:text-primary [&_p]:mt-2 [&_p]:font-body-md [&_p]:text-body-md [&_p]:text-on-surface-variant"
                data={confirmationMessage}
                enableGutter={false}
              />
            )}

            {enableResubmit && (
              <>
                <div
                  className={
                    compact
                      ? 'mx-auto mt-4 h-px w-full max-w-md bg-outline-variant/50'
                      : 'mx-auto mt-6 h-px w-full max-w-md bg-outline-variant/50'
                  }
                />
                <div className={compact ? 'mt-4 flex justify-center' : 'mt-6 flex justify-center'}>
                  <button
                    className="inline-flex items-center gap-2 rounded-full cursor-pointer border border-secondary/50 px-8 py-3 font-label-nav text-label-nav uppercase tracking-[0.14em] text-secondary transition hover:bg-secondary hover:text-on-secondary"
                    type="button"
                    onClick={resetSubmissionWithRecaptcha}
                  >
                    <CircleArrowRight size={16} strokeWidth={2} />
                    {resubmitButtonLabel || 'Submit another response'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {!hasSubmitted && (
        <form
          key={locale}
          className={
            isInquiryBanner
              ? 'grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-5 xl:gap-6'
              : compact
                ? 'space-y-3'
                : 'space-y-5'
          }
          id={formElementId}
          onSubmit={(event) => {
            const resolvedOwnerIntent = lockedOwnerIntent ?? ownerIntent
            if (isOwnerForm && resolvedOwnerIntent !== 'rent' && resolvedOwnerIntent !== 'sale') {
              setOwnerIntentError(ownerIntentRequiredMessage)
            }
            void handleSubmit(handleContactSubmit)(event)
          }}
        >
          {!isInquiryBanner && eyebrow && (
            <p
              className={
                isEditorial
                  ? 'mb-1 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]'
                  : 'font-label-nav text-label-nav uppercase tracking-[0.2em] text-secondary'
              }
            >
              {eyebrow}
            </p>
          )}
          {!isInquiryBanner && !hideHeading && (heading || formTitle) && (
            <>
              {isEditorial ? (
                <>
                  <div className="mt-4 h-px w-12 bg-secondary" aria-hidden />
                  <h3 className="mt-5 m-0 max-w-lg font-headline-lg text-[clamp(1.65rem,2.8vw,2.35rem)] font-light leading-[1.2] tracking-[0.01em] text-primary">
                    {heading || translatedFormTitle}
                  </h3>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
                    <h3 className="m-0 font-headline-md text-[clamp(1.35rem,2vw,1.75rem)] font-light tracking-[0.01em] text-primary">
                      {heading || translatedFormTitle}
                    </h3>
                  </div>
                  {!compact && <div className="h-px w-full bg-secondary/20" />}
                </>
              )}
            </>
          )}

          {!isInquiryBanner && description && (
            <p
              className={
                isEditorial
                  ? 'mt-4 m-0 max-w-lg font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/70 md:text-[16px]'
                  : compact
                    ? 'font-body-sm text-body-sm text-on-surface-variant'
                    : 'font-body-md text-body-md text-on-surface-variant'
              }
            >
              {description}
            </p>
          )}

          {error && (
            <div
              className={`rounded-xl border border-error/30 bg-error/5 px-4 py-3 ${isInquiryBanner ? 'lg:col-span-12' : ''}`}
              role="alert"
            >
              <p className="flex items-start gap-2 font-body-md text-body-md text-error">
                <AlertCircle className="mt-0.5 shrink-0" size={20} strokeWidth={2} />
                <span>{error.message}</span>
              </p>
            </div>
          )}

          {isInquiryBanner ? (
            <>
              {ownerIntentControl}
              <fieldset
                key={`${locale}-primary`}
                className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0 lg:col-span-3"
                disabled={isLoading}
              >
                {primaryFields.map((field, index) => renderField(field, index))}
              </fieldset>

              <fieldset
                key={`${locale}-message`}
                className="m-0 min-w-0 border-0 p-0 lg:col-span-5"
                disabled={isLoading}
              >
                {messageFields.map((field, index) =>
                  renderField(field, index, 'h-full [&_textarea]:min-h-[220px]'),
                )}
              </fieldset>

              <div className="flex min-w-0 flex-col gap-4 lg:col-span-4 lg:pt-0.5">
                {deferredLocale && recaptchaConfigured && !hasSubmitted && (
                  <div
                    className={`w-full max-w-full space-y-2 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <RecaptchaWidget
                      key={`${deferredLocale}-${recaptchaResetKey}`}
                      locale={deferredLocale}
                      onError={setRecaptchaLoadError}
                      onTokenChange={(token) => {
                        setRecaptchaToken(token)
                        if (token) setRecaptchaValidationError(null)
                      }}
                      siteKey={recaptchaSiteKey}
                    />
                    {recaptchaLoadError && (
                      <p className="font-body-sm text-body-sm text-error">{recaptchaLoadError}</p>
                    )}
                    {recaptchaValidationError && (
                      <p className="mt-2 text-sm text-red-500">{recaptchaValidationError}</p>
                    )}
                  </div>
                )}

                <fieldset
                  key={`${locale}-checks`}
                  className="m-0 min-w-0 border-0 p-0"
                  disabled={isLoading}
                >
                  {checkboxFields.map((field, index) => renderField(field, index))}
                </fieldset>

                <button
                  aria-busy={isLoading}
                  disabled={isLoading}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-md border border-secondary bg-secondary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_30px_-16px_color-mix(in_srgb,var(--color-secondary)_70%,transparent)] transition-all duration-300 ${
                    isLoading
                      ? 'cursor-not-allowed opacity-80'
                      : 'cursor-pointer hover:border-primary hover:bg-primary hover:text-on-primary active:scale-[0.98]'
                  }`}
                  type="submit"
                >
                  <Loader2
                    aria-hidden
                    className={isLoading ? 'animate-spin' : 'hidden'}
                    size={18}
                    strokeWidth={2}
                  />
                  <span>
                    {isLoading ? submittingLabel : submitLabelOverride || translatedSubmitLabel}
                  </span>
                </button>

                {trustNote ? (
                  <p className="flex items-center justify-center gap-2 text-center font-label-sm text-[12px] leading-snug text-on-surface/55">
                    <Lock className="shrink-0 text-secondary" size={15} strokeWidth={2} />
                    <span>{trustNote}</span>
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {ownerIntentControl}
              <fieldset
                key={locale}
                className={`m-0 min-w-0 border-0 p-0 ${showOwnerIntent ? '!mt-6' : ''} ${
                  pairedFields
                    ? 'grid grid-cols-2 gap-x-4 gap-y-3'
                    : singleColumn
                      ? compact
                        ? 'grid grid-cols-1 gap-2.5'
                        : 'grid grid-cols-1 gap-4'
                      : compact
                        ? 'grid grid-cols-1 gap-2.5 md:grid-cols-2'
                        : 'grid grid-cols-1 gap-4 md:grid-cols-2'
                }`}
                disabled={isLoading}
              >
                {visibleFields.map((field, index) => {
                  const blockType = field.blockType as string
                  const isWideField =
                    blockType === 'textarea' ||
                    blockType === 'message' ||
                    blockType === 'country' ||
                    blockType === 'checkbox'
                  const isMessage = blockType === 'textarea' || blockType === 'message'
                  const fieldWrapperClass = [
                    pairedFields
                      ? isWideField
                        ? 'col-span-2'
                        : 'min-w-0'
                      : !singleColumn && isWideField
                        ? 'md:col-span-2'
                        : '',
                    isMessage
                      ? showOwnerIntent
                        ? '[&_textarea]:h-20 [&_textarea]:min-h-0 [&_textarea]:resize-none'
                        : '[&_textarea]:min-h-32'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return renderField(field, index, fieldWrapperClass)
                })}
              </fieldset>

              {deferredLocale && recaptchaConfigured && !hasSubmitted && (
                <div
                  className={`w-full max-w-full space-y-2 ${compact ? 'mt-1' : 'mt-4'} ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <RecaptchaWidget
                    key={`${deferredLocale}-${recaptchaResetKey}`}
                    locale={deferredLocale}
                    onError={setRecaptchaLoadError}
                    onTokenChange={(token) => {
                      setRecaptchaToken(token)
                      if (token) setRecaptchaValidationError(null)
                    }}
                    siteKey={recaptchaSiteKey}
                  />
                  {recaptchaLoadError && (
                    <p className="font-body-sm text-body-sm text-error">{recaptchaLoadError}</p>
                  )}
                  {recaptchaValidationError && (
                    <p className="mt-2 text-red-500 text-sm">{recaptchaValidationError}</p>
                  )}
                </div>
              )}

              <button
                aria-busy={isLoading}
                disabled={isLoading}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-md border border-secondary bg-secondary font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)] transition-all duration-300 ${
                  compact ? 'px-6 py-3' : 'px-8 py-3.5'
                } ${
                  isLoading
                    ? 'cursor-not-allowed opacity-80'
                    : 'cursor-pointer hover:border-primary hover:bg-primary hover:text-on-primary'
                }`}
                type="submit"
              >
                <Loader2
                  aria-hidden
                  className={isLoading ? 'animate-spin' : 'hidden'}
                  size={18}
                  strokeWidth={2}
                />
                <span>
                  {isLoading ? submittingLabel : submitLabelOverride || translatedSubmitLabel}
                </span>
              </button>

              {trustNote && (
                <p
                  className={
                    isEditorial
                      ? 'flex items-center justify-center gap-2 text-center font-label-sm text-[12px] text-on-surface/55'
                      : 'flex items-center justify-center gap-2 text-center font-label-sm text-label-sm text-on-surface-variant'
                  }
                >
                  <Lock size={16} strokeWidth={2} />
                  {trustNote}
                </p>
              )}
            </>
          )}
        </form>
      )}
    </FormProvider>
  )
}
