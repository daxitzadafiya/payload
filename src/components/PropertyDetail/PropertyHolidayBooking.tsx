'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  CircleArrowRight,
  Info,
  Lock,
  Loader2,
  Moon,
  Users,
  Clock,
} from 'lucide-react'

import { HOLIDAY_BOOKING_SECTION_ID } from '@/components/PropertyDetail/PropertyDetailActions'
import { PropertyHolidayCalendar } from '@/components/PropertyDetail/PropertyHolidayCalendar'
import { PhoneInputField } from '@/components/PhoneInput/PhoneInputField'
import { COUNT_FILTER_OTHER_VALUE, GUEST_OPTIONS } from '@/components/PropertyList/filterOptions'
import { CountFilterField } from '@/components/PropertyList/CountFilterField'
import { RecaptchaWidget } from '@/components/RecaptchaWidget/RecaptchaWidget'
import { Checkbox as CheckboxUi } from '@/components/ui/checkbox'
import { CMSLink } from '@/components/Link'
import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import {
  clampHolidayGuestCount,
  MIN_HOLIDAY_GUESTS,
  parseHolidayGuestCount,
  resolveMaxHolidayGuests,
} from '@/utilities/crmHoliday'
import { useSiteLocale } from '@/utilities/useSiteLocale'
import {
  calculateHolidayRentalQuote,
  countNights,
  DEFAULT_MINIMUM_STAY,
  formatEuro,
  isRangeAvailable,
  getBlockedDateKeys,
  parseDateOnly,
  parseRentalSeasons,
  type CRMPropertyBooking,
} from '@/utilities/holidayRentalPricing'
import { HOLIDAY_CHECK_IN_HOUR, HOLIDAY_CHECK_OUT_HOUR } from '@/utilities/holidayStayTimes'
import {
  useFormFieldInvalidEmailMessage,
  useFormFieldInvalidPhoneMessage,
  useFormFieldRequiredMessage,
  useTranslation,
} from '@/utilities/translateClient'
import { formatPhoneE164 } from '@/utilities/phoneValidation'
import { validatePhoneValue } from '@/utilities/phoneValidationRules'

const EMAIL_PATTERN = /^\S[^\s@]*@\S+$/
const PRIVACY_POLICY_VALIDATION_KEY = 'form.validation.privacyPolicy.required'
const PRIVACY_POLICY_VALIDATION_FALLBACK = 'You must accept the Privacy Policy to continue.'

type Props = {
  /** System CRM reference — sent as `property_reference` for Optima identity. */
  propertyReference: string
  /** Admin display REF for email callout; falls back to propertyReference. */
  displayReference?: string
  propertyTitle: string
  rentalSeasons: ReturnType<typeof parseRentalSeasons>
  bookings?: CRMPropertyBooking[]
  /** CRM `sleeps` — max guests (falls back to 25). */
  sleeps?: number
  /** CRM `minimum_stay.saty_number` — defaults to 1 when absent. */
  minimumStay?: number
  /** CRM `security_deposit` from view-by-ref. */
  securityDeposit?: number
  arrival: string
  departure: string
  guests: string
  onArrivalChange: (value: string) => void
  onDepartureChange: (value: string) => void
  onGuestsChange: (value: string) => void
  /** Soft-refresh CRM bookings after a successful enquiry. */
  onRefreshBookings?: () => Promise<void>
}

type BookingFormState = {
  forename: string
  surname: string
  email: string
  mobile: string
  message: string
}

type BookingFieldErrors = {
  dates?: string
  forename?: string
  email?: string
  mobile?: string
  terms?: string
}

const defaultFormState = (): BookingFormState => ({
  forename: '',
  surname: '',
  email: '',
  mobile: '',
  message: '',
})

const formatDisplayDate = (value: string) => {
  const date = parseDateOnly(value)
  if (!date) return '—'
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (value: string, hour: number) => {
  const date = parseDateOnly(value)
  if (!date) return '—'
  date.setHours(hour, 0, 0, 0)
  return date.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  })
}

function renderTermsCheckboxLabel(label: string, privacyPolicyLabel: string) {
  if (!privacyPolicyLabel) return label

  const escaped = privacyPolicyLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = label.split(new RegExp(`(${escaped})`, 'i'))

  return parts.map((part, index) =>
    new RegExp(`^${escaped}$`, 'i').test(part) ? (
      <CMSLink
        key={index}
        appearance="inline"
        className="font-medium text-secondary decoration-secondary/40 underline-offset-2 cursor-pointer hover:text-secondary/80"
        label={privacyPolicyLabel}
        newTab={true}
        type="custom"
        url="/privacy"
      />
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  )
}

export const PropertyHolidayBooking: React.FC<Props> = ({
  propertyReference,
  displayReference,
  propertyTitle,
  rentalSeasons,
  bookings = [],
  sleeps,
  minimumStay = DEFAULT_MINIMUM_STAY,
  securityDeposit,
  arrival,
  departure,
  guests,
  onArrivalChange,
  onDepartureChange,
  onGuestsChange,
  onRefreshBookings,
}) => {
  const heading = useTranslation('propertyDetail.holiday.heading', 'Book Your Stay')
  const selectDatesTitle = useTranslation('propertyDetail.holiday.selectDatesTitle', 'Select dates')
  const guestsLabel = useTranslation('propertyList.filters.guests', 'Guests')
  const needMoreLabel = useTranslation('propertyList.filters.needMore', 'Need More')
  const firstNameLabel = useTranslation('propertyDetail.holiday.firstName', 'First Name')
  const lastNameLabel = useTranslation('propertyDetail.holiday.lastName', 'Last Name')
  const emailLabel = useTranslation('propertyDetail.holiday.email', 'Email')
  const phoneLabel = useTranslation('propertyDetail.holiday.phone', 'Phone Number')
  const messageLabel = useTranslation('propertyDetail.holiday.message', 'Message')
  const submitLabel = useTranslation('propertyDetail.holiday.submit', 'Enquire / Book')
  const submittingLabel = useTranslation('propertyDetail.holiday.submitting', 'Sending enquiry…')
  const successTitle = useTranslation('propertyDetail.inquiry.successTitle', 'Request Received')
  const successSubtitlePrefix = useTranslation(
    'propertyDetail.inquiry.successSubtitlePrefix',
    'Our team will contact you shortly about',
  )
  const successThanks = useTranslation(
    'propertyDetail.inquiry.successThanks',
    'Thanks for connecting',
  )
  const resubmitButtonLabel = useTranslation(
    'propertyDetail.inquiry.resubmitButton',
    'Send another inquiry',
  )
  const priceLabel = useTranslation('propertyDetail.holiday.price', 'Price')
  const perPersonPerNightLabel = useTranslation(
    'propertyDetail.holiday.perPersonPerNight',
    'Per Person Per Night',
  )
  const totalNightsLabel = useTranslation(
    'propertyDetail.holiday.totalLabel',
    'Total',
  )
  const cleaningChargesIncludedLabel = useTranslation(
    'propertyDetail.holiday.cleaningChargesIncluded1',
    'Your booking price encompasses all essentials, including bedding and towels, electricity, water, and Internet (if available in the property), along with a final cleaning fee. To secure your reservation, please proceed by making the required security deposit payment.',
  )
  const securityDepositLabel = useTranslation(
    'propertyDetail.holiday.securityDeposit',
    'Security deposit',
  )
  const maximumPersonsLabel = useTranslation(
    'propertyDetail.holiday.maximumPersons',
    'Maximum {count} Persons',
  )
  const minimumStayLabel = useTranslation(
    'propertyDetail.holiday.minimumStayLabel',
    'Minimum {count} nights',
  )
  const selectDatesHint = useTranslation(
    'propertyDetail.holiday.selectDatesHint',
    'Select arrival and departure dates to see the rental price.',
  )
  const priceLoadingLabel = useTranslation(
    'propertyDetail.holiday.priceLoading',
    'Calculating price…',
  )
  const priceUnavailableLabel = useTranslation(
    'propertyDetail.holiday.priceUnavailable',
    'Could not load price for these dates. Please try again.',
  )
  const datesRequiredMessage = useTranslation(
    'propertyDetail.holiday.datesRequired',
    'Select dates is required',
  )
  const unavailableHint = useTranslation(
    'propertyDetail.holiday.unavailableHint',
    'Selected dates are not available. Please choose different dates.',
  )
  const minimumStayRequiredMessage = useTranslation(
    'propertyDetail.holiday.minimumStayRequired',
    'Please select at least {count} nights for this stay.',
  )
  const trustNote = useTranslation(
    'propertyDetail.inquiry.trustNote',
    'By clicking submit, you agree to our privacy policy and terms.',
  )
  const requiredError = useTranslation(
    'propertyDetail.holiday.requiredError',
    'Please complete all required fields and select valid dates.',
  )
  const termsLabel = useTranslation(
    'propertyDetail.holiday.termsLabel',
    'I confirm that I have reviewed and accepted the Privacy Policy.',
  )
  const privacyPolicyLabel = useTranslation(
    'propertyDetail.holiday.privacyPolicyLink',
    'Privacy Policy',
  )
  const submitErrorLabel = useTranslation(
    'propertyDetail.holiday.submitError',
    'Could not send your enquiry. Please try again.',
  )
  const checkInLabel = useTranslation('propertyDetail.holiday.checkIn', 'Check-in')
  const checkOutLabel = useTranslation('propertyDetail.holiday.checkOut', 'Check-out')
  const yourDetailsLabel = useTranslation('propertyDetail.holiday.yourDetails', 'Your details')
  const forenameRequiredMessage = useFormFieldRequiredMessage('forename', firstNameLabel)
  const emailRequiredMessage = useFormFieldRequiredMessage('email', emailLabel)
  const emailInvalidMessage = useFormFieldInvalidEmailMessage('email')
  const mobileRequiredMessage = useFormFieldRequiredMessage('phone', phoneLabel)
  const mobileInvalidMessage = useFormFieldInvalidPhoneMessage('phone')
  const termsAcceptanceError = useTranslation(
    PRIVACY_POLICY_VALIDATION_KEY,
    PRIVACY_POLICY_VALIDATION_FALLBACK,
  )

  const maxGuests = resolveMaxHolidayGuests(sleeps)
  const guestsCustomPlaceholder = useTranslation(
    'propertyList.filters.guestsCustomPlaceholder',
    `1–${maxGuests}`,
  )

  const guestOptions = useMemo(() => {
    const presets = GUEST_OPTIONS.filter((option) => {
      if (option.value === 'any' || option.value === COUNT_FILTER_OTHER_VALUE) return false
      const count = Number(option.value)
      return Number.isFinite(count) && count >= MIN_HOLIDAY_GUESTS && count <= maxGuests
    })
    return [...presets, { value: COUNT_FILTER_OTHER_VALUE, label: needMoreLabel }]
  }, [maxGuests, needMoreLabel])

  const resolvedGuestCount = clampHolidayGuestCount(
    parseHolidayGuestCount(guests && guests !== 'any' ? guests : '2'),
    maxGuests,
  )

  const isPresetGuestCount = (count: number) =>
    guestOptions.some((option) => option.value === String(count))

  // Booking only stores a numeric guests string — keep a separate "Need More" mode
  // so selecting other does not immediately snap back onto a preset (e.g. "2").
  const [guestsCustomMode, setGuestsCustomMode] = useState(
    () => !isPresetGuestCount(resolvedGuestCount),
  )
  const [guestsCustomDraft, setGuestsCustomDraft] = useState(() =>
    isPresetGuestCount(resolvedGuestCount) ? '' : String(resolvedGuestCount),
  )

  const guestsSelectValue = guestsCustomMode ? COUNT_FILTER_OTHER_VALUE : String(resolvedGuestCount)
  const guestsCustomValue = guestsCustomMode ? guestsCustomDraft : ''

  const handleGuestsSelectChange = (value: string) => {
    if (value === COUNT_FILTER_OTHER_VALUE) {
      setGuestsCustomMode(true)
      setGuestsCustomDraft(String(resolvedGuestCount))
      return
    }
    setGuestsCustomMode(false)
    setGuestsCustomDraft('')
    onGuestsChange(value)
  }

  const handleGuestsCustomChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      setGuestsCustomDraft('')
      return
    }
    const clamped = String(clampHolidayGuestCount(Number(digits), maxGuests))
    setGuestsCustomDraft(clamped)
    onGuestsChange(clamped)
  }

  const [form, setForm] = useState<BookingFormState>(() => defaultFormState())
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [apiTotalPrice, setApiTotalPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)

  const { settings: integrations } = useIntegrationsSettings()
  const recaptchaSiteKey = integrations.recaptchaSiteKey
  const recaptchaConfigured = Boolean(recaptchaSiteKey)
  const locale = useSiteLocale()

  const recaptchaRequiredMessage = useTranslation(
    'form.validation.recaptcha.hint',
    'Please verify you are not a robot.',
  )
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaLoadError, setRecaptchaLoadError] = useState<string | null>(null)
  const [recaptchaValidationError, setRecaptchaValidationError] = useState<string | null>(null)
  const [recaptchaResetKey, setRecaptchaResetKey] = useState(0)

  const blocked = useMemo(() => getBlockedDateKeys(bookings), [bookings])

  const quote = useMemo(() => {
    if (!arrival || !departure) return null
    return calculateHolidayRentalQuote({
      seasons: rentalSeasons,
      checkIn: arrival,
      checkOut: departure,
      guests: resolvedGuestCount,
      minimumStay,
    })
  }, [arrival, departure, minimumStay, resolvedGuestCount, rentalSeasons])

  const selectedNights = useMemo(() => {
    if (!arrival || !departure) return 0
    const from = parseDateOnly(arrival)
    const to = parseDateOnly(departure)
    if (!from || !to) return 0
    return countNights(from, to)
  }, [arrival, departure])

  const datesAvailable = arrival && departure ? isRangeAvailable(blocked, arrival, departure) : true

  const effectiveMinimumStay = quote?.minimumPeriod ?? minimumStay
  const meetsMinimumStay = !quote || quote.nights >= quote.minimumPeriod
  const showMinimumStayError = Boolean(quote && !meetsMinimumStay)

  // Fetch CRM stay total via our server proxy (API key never reaches the browser).
  useEffect(() => {
    if (!arrival || !departure || !propertyReference || selectedNights <= 0 || !datesAvailable) {
      setApiTotalPrice(null)
      setPriceLoading(false)
      setPriceError(null)
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({
      property: propertyReference,
      from: arrival,
      to: departure,
    })

    setPriceLoading(true)
    setPriceError(null)
    setApiTotalPrice(null)

    void (async () => {
      try {
        const response = await fetch(`/api/crm/properties/calculate-rental-price?${params}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const payload = (await response.json().catch(() => null)) as {
          short_term_rental_price?: number
          error?: string
        } | null

        if (!response.ok) {
          throw new Error(payload?.error ?? `Price lookup failed (${response.status})`)
        }

        const price = payload?.short_term_rental_price
        if (typeof price !== 'number' || !Number.isFinite(price)) {
          throw new Error(priceUnavailableLabel)
        }

        if (!controller.signal.aborted) {
          setApiTotalPrice(price)
          setPriceError(null)
        }
      } catch (fetchError) {
        if (controller.signal.aborted) return
        console.error('Holiday rental price lookup failed', fetchError)
        setApiTotalPrice(null)
        setPriceError(
          fetchError instanceof Error && fetchError.message
            ? fetchError.message
            : priceUnavailableLabel,
        )
      } finally {
        if (!controller.signal.aborted) setPriceLoading(false)
      }
    })()

    return () => controller.abort()
  }, [arrival, departure, datesAvailable, priceUnavailableLabel, propertyReference, selectedNights])

  const clearFieldError = (key: keyof BookingFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const handleFieldChange = (key: keyof BookingFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
    if (key === 'forename' || key === 'email' || key === 'mobile') {
      clearFieldError(key)
    }
  }

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked)
    if (checked) clearFieldError('terms')
  }

  const handleArrivalChange = (value: string) => {
    onArrivalChange(value)
    clearFieldError('dates')
    setError(null)
  }

  const handleDepartureChange = (value: string) => {
    onDepartureChange(value)
    clearFieldError('dates')
    setError(null)
  }

  const validateDetails = (): boolean => {
    const next: BookingFieldErrors = {}

    if (!arrival || !departure) {
      next.dates = datesRequiredMessage
    }

    if (!form.forename.trim()) {
      next.forename = forenameRequiredMessage
    }

    const emailValue = form.email.trim()
    if (!emailValue) {
      next.email = emailRequiredMessage
    } else if (!EMAIL_PATTERN.test(emailValue)) {
      next.email = emailInvalidMessage
    }

    const mobileError = validatePhoneValue(form.mobile, {
      required: true,
      requiredMessage: mobileRequiredMessage,
      invalidPhoneMessage: mobileInvalidMessage,
    })
    if (mobileError) {
      next.mobile = mobileError
    }

    if (!termsAccepted) {
      next.terms = termsAcceptanceError
    }

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setRecaptchaValidationError(null)
    setError(null)

    const detailsValid = validateDetails()
    const recaptchaMissing = recaptchaConfigured && !recaptchaToken

    if (recaptchaMissing) {
      setRecaptchaValidationError(recaptchaRequiredMessage)
    }

    if (!detailsValid || recaptchaMissing) {
      return
    }

    if (
      !propertyReference ||
      !quote ||
      !datesAvailable ||
      !meetsMinimumStay ||
      apiTotalPrice == null ||
      priceLoading
    ) {
      setError(requiredError)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/crm/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_reference: propertyReference,
          display_reference: (displayReference || propertyReference).trim(),
          forename: form.forename.trim(),
          surname: form.surname.trim(),
          email: form.email.trim(),
          mobile: formatPhoneE164(form.mobile.trim()),
          guests: resolvedGuestCount,
          message: form.message.trim(),
          arrival,
          departure,
          locale,
          price: apiTotalPrice,
          recaptchaToken,
          terms_accepted: termsAccepted,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? `Booking failed (${response.status})`)
      }

      // Refresh CRM bookings before success so the availability calendar updates immediately.
      await onRefreshBookings?.()

      onArrivalChange('')
      onDepartureChange('')
      setSubmitted(true)
    } catch (submitError) {
      console.error('Holiday booking enquiry failed', submitError)
      const message = submitError instanceof Error ? submitError.message : submitErrorLabel
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    const successSubtitle = propertyTitle.trim()
      ? `${successSubtitlePrefix} ${propertyTitle.trim()}.`
      : `${successSubtitlePrefix}.`

    const handleSendAnotherEnquiry = () => {
      setForm(defaultFormState())
      setFieldErrors({})
      setError(null)
      setTermsAccepted(false)
      setRecaptchaToken('')
      setRecaptchaLoadError(null)
      setRecaptchaValidationError(null)
      setRecaptchaResetKey((key) => key + 1)
      setGuestsCustomMode(false)
      setGuestsCustomDraft('')
      onArrivalChange('')
      onDepartureChange('')
      onGuestsChange('2')
      setSubmitted(false)
    }

    return (
      <div
        id={HOLIDAY_BOOKING_SECTION_ID}
        className="max-lg:static max-lg:top-auto relative scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-secondary/30 bg-surface-cream p-4 shadow-[0_28px_60px_-32px_rgba(0,0,0,0.28)] sm:p-6 md:rounded-[2rem] lg:sticky lg:top-32 lg:scroll-mt-32"
      >
        <div className="relative overflow-hidden rounded-[1.25rem] border border-secondary/20 bg-surface-sand/60 px-6 py-10 md:px-8 md:py-12">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-secondary/5 to-transparent" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-44 w-44 rounded-full border-22 border-secondary/10" />
          <div className="pointer-events-none absolute -left-16 -bottom-14 h-36 w-56 rounded-[100%] border border-secondary/10" />

          <div className="relative z-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-sm">
              <Check size={30} strokeWidth={2.5} />
            </div>

            <div className="mx-auto max-w-md">
              {successTitle && (
                <h3 className="font-headline-md text-headline-md font-light text-primary">{successTitle}</h3>
              )}
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                {successSubtitle}
              </p>
              {successThanks && (
                <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                  {successThanks}
                </p>
              )}
            </div>

            <div className="mx-auto mt-6 h-px w-full max-w-md bg-secondary/25" />
            <div className="mt-6 flex justify-center">
              <button
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-secondary/50 px-8 py-3 font-label-nav text-[11px] uppercase tracking-[0.14em] text-secondary transition hover:bg-secondary hover:text-on-secondary"
                type="button"
                onClick={handleSendAnotherEnquiry}
              >
                <CircleArrowRight size={16} strokeWidth={2} />
                {resubmitButtonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="max-lg:static max-lg:top-auto contact-form-editorial relative scroll-mt-28 space-y-4 overflow-hidden rounded-[1.75rem] border border-secondary/30 bg-surface-cream p-4 shadow-[0_28px_60px_-32px_rgba(0,0,0,0.28)] sm:p-6 md:rounded-[2rem] lg:sticky lg:top-32 lg:scroll-mt-32"
      id={HOLIDAY_BOOKING_SECTION_ID}
    >
      <h2 className="font-headline-md text-headline-md text-primary">{heading}</h2>

      <div
        className={`rounded-xl transition-colors ${
          showMinimumStayError ? 'border border-red-300 bg-red-50/70 p-3' : ''
        }`}
      >
        <h3 className="mb-3 font-headline-sm text-headline-sm text-primary">{selectDatesTitle}</h3>
        <PropertyHolidayCalendar
          bookings={bookings}
          arrival={arrival}
          departure={departure}
          onArrivalChange={handleArrivalChange}
          onDepartureChange={handleDepartureChange}
          compact
          showTitle={false}
          showLegend
          legendVariant="availability"
        />
        {fieldErrors.dates && <div className="mt-2 text-red-500 text-sm">{fieldErrors.dates}</div>}
        {showMinimumStayError && (
          <p className="mt-2 flex items-start gap-1.5 text-body-sm font-medium text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={16} strokeWidth={2} />
            <span>
              {minimumStayRequiredMessage.replace('{count}', String(effectiveMinimumStay))}
            </span>
          </p>
        )}

        {(arrival || departure) && (
          <div
            className={`mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-xl ${
              showMinimumStayError
                ? 'border border-red-200 bg-red-100/60'
                : 'border border-outline-variant/25 bg-outline-variant/25'
            }`}
          >
            <div className="bg-surface-container-lowest px-3 py-2.5">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                {checkInLabel}
              </p>
              <p className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
                <CalendarDays size={15} className="shrink-0 text-secondary" strokeWidth={2} />
                {arrival ? formatDisplayDate(arrival) : '—'}
              </p>
              <p className="mt-1 flex items-center gap-2 text-body-sm font-medium text-on-surface">
                <Clock size={15} className="shrink-0 text-secondary" strokeWidth={2} />
                {arrival ? formatTime(arrival, HOLIDAY_CHECK_IN_HOUR) : '—'}
              </p>
            </div>
            <div className="bg-surface-container-lowest px-3 py-2.5">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                {checkOutLabel}
              </p>
              <p className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
                <CalendarDays size={15} className="shrink-0 text-secondary" strokeWidth={2} />
                {departure ? formatDisplayDate(departure) : '—'}
              </p>
              <p className="mt-1 flex items-center gap-2 text-body-sm font-medium text-on-surface">
                <Clock size={15} className="shrink-0 text-secondary" strokeWidth={2} />
                {departure ? formatTime(departure, HOLIDAY_CHECK_OUT_HOUR) : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
          <Users size={15} className="shrink-0 text-secondary" strokeWidth={2} />
          {maximumPersonsLabel.replace('{count}', String(maxGuests))}
        </p>
        <p
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm font-medium transition-colors ${
            showMinimumStayError
              ? '-mx-2 border border-red-300 bg-red-50 text-red-700'
              : 'text-on-surface'
          }`}
        >
          <Moon
            size={15}
            className={`shrink-0 ${showMinimumStayError ? 'text-red-600' : 'text-secondary'}`}
            strokeWidth={2}
          />
          {minimumStayLabel.replace('{count}', String(effectiveMinimumStay))}
        </p>
      </div>

      <CountFilterField
        label={guestsLabel}
        id="holiday-booking-guests"
        icon={<Users size={20} strokeWidth={1.75} />}
        options={guestOptions}
        value={guestsSelectValue}
        customValue={guestsCustomValue}
        onChange={handleGuestsSelectChange}
        onCustomChange={handleGuestsCustomChange}
        customPlaceholder={guestsCustomPlaceholder}
      />

      <div
        className={`rounded-xl p-4 transition-colors ${
          quote ? 'border border-secondary/25 bg-secondary/5' : 'bg-surface-sand/70'
        }`}
      >
        {quote ? (
          <div className="space-y-3">
            <p className="font-headline-sm text-headline-sm text-primary">{priceLabel}:</p>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-body-sm text-on-surface-variant">
                  {perPersonPerNightLabel}
                </span>
                <span className="shrink-0 text-body-sm font-semibold text-on-surface">
                  {formatEuro(quote.perPersonPerNight)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-body-sm text-on-surface-variant">
                  {totalNightsLabel}
                  <span
                    className="group relative inline-flex shrink-0 outline-none"
                    tabIndex={0}
                  >
                    <Info
                      aria-label={cleaningChargesIncludedLabel}
                      className="text-secondary/80 transition-colors group-hover:text-secondary group-focus-visible:text-secondary"
                      size={14}
                      strokeWidth={2}
                    />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-[12rem] -translate-x-1/2 rounded-md bg-on-surface px-2 py-1 text-center text-[11px] leading-snug text-surface opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      {cleaningChargesIncludedLabel}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-body-sm font-semibold text-secondary">
                  {priceLoading ? (
                    <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                      <Loader2 className="animate-spin" size={14} strokeWidth={2} />
                      {priceLoadingLabel}
                    </span>
                  ) : apiTotalPrice != null ? (
                    formatEuro(apiTotalPrice)
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              {securityDeposit != null && (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-body-sm text-on-surface-variant">
                    {securityDepositLabel}
                  </span>
                  <span className="shrink-0 text-body-sm font-semibold text-on-surface">
                    {formatEuro(securityDeposit)}
                  </span>
                </div>
              )}
            </div>
            {!datesAvailable && <p className="pt-1 text-body-sm text-red-600">{unavailableHint}</p>}
            {datesAvailable && priceError && (
              <p className="pt-1 text-body-sm text-red-600">{priceError}</p>
            )}
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant">{selectDatesHint}</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 border-t border-outline-variant/15 pt-4"
        noValidate
      >
        <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
          {yourDetailsLabel}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
              {firstNameLabel} *
            </span>
            <input
              type="text"
              value={form.forename}
              onChange={(event) => handleFieldChange('forename', event.target.value)}
              placeholder={firstNameLabel}
              className="w-full rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-0"
            />
            {fieldErrors.forename && (
              <div className="mt-2 text-red-500 text-sm">{fieldErrors.forename}</div>
            )}
          </label>
          <label className="block">
            <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
              {lastNameLabel}
            </span>
            <input
              type="text"
              value={form.surname}
              onChange={(event) => handleFieldChange('surname', event.target.value)}
              placeholder={lastNameLabel}
              className="w-full rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-0"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
            {emailLabel} *
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            placeholder={emailLabel}
            className="w-full rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-0"
          />
          {fieldErrors.email && (
            <div className="mt-2 text-red-500 text-sm">{fieldErrors.email}</div>
          )}
        </label>

        <label className="block">
          <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
            {phoneLabel} *
          </span>
          <PhoneInputField
            id="holiday-mobile"
            invalid={Boolean(fieldErrors.mobile)}
            name="mobile"
            placeholder={phoneLabel}
            showValidation={Boolean(fieldErrors.mobile)}
            value={form.mobile}
            variant="holiday"
            onChange={(value) => handleFieldChange('mobile', value)}
          />
          {fieldErrors.mobile && (
            <div className="mt-2 text-red-500 text-sm">{fieldErrors.mobile}</div>
          )}
        </label>

        <label className="block">
          <span className="mb-1 ml-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">
            {messageLabel}
          </span>
          <textarea
            rows={3}
            value={form.message}
            onChange={(event) => handleFieldChange('message', event.target.value)}
            placeholder={messageLabel}
            className="w-full resize-y rounded-lg border border-transparent bg-surface-container-low px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-0"
          />
        </label>

        <div className="pt-2">
          <label
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-4 py-3.5"
            htmlFor="holiday-terms-checkbox"
          >
            <CheckboxUi
              id="holiday-terms-checkbox"
              checked={termsAccepted}
              onCheckedChange={(checked) => handleTermsChange(checked === true)}
              aria-label={termsLabel}
            />
            <span className="text-body-sm text-on-surface leading-relaxed">
              <span className="mr-1 text-secondary">*</span>
              {renderTermsCheckboxLabel(termsLabel, privacyPolicyLabel)}
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="mt-2 flex items-start gap-1.5 text-red-500 text-sm">
              <AlertCircle className="shrink-0" size={16} strokeWidth={2} />
              <span>{fieldErrors.terms}</span>
            </p>
          )}
        </div>

        {recaptchaConfigured && (
          <div
            className={`mt-3 w-full max-w-full space-y-2 ${submitting ? 'pointer-events-none opacity-60' : ''}`}
          >
            <RecaptchaWidget
              key={`${locale}-${recaptchaResetKey}`}
              locale={locale}
              siteKey={recaptchaSiteKey}
              onError={setRecaptchaLoadError}
              onTokenChange={(token) => {
                setRecaptchaToken(token)
                if (token) setRecaptchaValidationError(null)
              }}
            />
            {recaptchaLoadError && (
              <p className="font-body-sm text-body-sm text-error">{recaptchaLoadError}</p>
            )}
            {recaptchaValidationError && (
              <p className="mt-2 text-red-500 text-sm">{recaptchaValidationError}</p>
            )}
          </div>
        )}

        {error && <p className="text-body-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={
            submitting ||
            showMinimumStayError ||
            (Boolean(arrival && departure) && (priceLoading || apiTotalPrice == null))
          }
          aria-busy={submitting || priceLoading}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-md border border-secondary bg-secondary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)] transition ${
            submitting ||
            showMinimumStayError ||
            (Boolean(arrival && departure) && (priceLoading || apiTotalPrice == null))
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer active:scale-95 hover:opacity-90'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={18} strokeWidth={2} />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </button>

        {trustNote && (
          <p className="flex items-center justify-center gap-2 text-center font-label-sm text-label-sm text-on-surface-variant">
            <Lock size={16} strokeWidth={2} />
            {trustNote}
          </p>
        )}
      </form>
    </div>
  )
}
