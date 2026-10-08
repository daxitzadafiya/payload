'use client'

import React, { useEffect, useState } from 'react'
import PhoneInput from 'react-phone-input-2'
import type { CountryData } from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

import { useVisitorCountry } from '@/hooks/useVisitorCountry'
import { cn } from '@/utilities/ui'
import {
  normalizePhoneInputValue,
  resolveDefaultPhoneCountry,
  validatePhoneInputValue,
} from '@/utilities/phoneValidation'
import { useTranslation } from '@/utilities/translateClient'
import { useSiteLocale } from '@/utilities/useSiteLocale'

import './phone-input.css'

export type PhoneInputVariant = 'contact' | 'holiday'

type Props = {
  id?: string
  name?: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  variant?: PhoneInputVariant
  invalid?: boolean
  /** When true, react-phone-input-2 inline validation styling is enabled. */
  showValidation?: boolean
  className?: string
}

const PREFERRED_COUNTRIES = ['de', 'gr', 'gb', 'fr', 'es', 'pt', 'it', 'us', 'nl', 'at', 'ch']

function resolveCountryFromData(data: CountryData | Record<string, unknown>): string | null {
  const code =
    ('countryCode' in data && typeof data.countryCode === 'string' ? data.countryCode : null) ??
    ('iso2' in data && typeof data.iso2 === 'string' ? data.iso2 : null)

  const normalized = code?.trim().toLowerCase()
  return normalized && /^[a-z]{2}$/.test(normalized) ? normalized : null
}

export const PhoneInputField: React.FC<Props> = ({
  id,
  name,
  value = '',
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  variant = 'contact',
  invalid = false,
  showValidation = false,
  className,
}) => {
  const locale = useSiteLocale()
  const visitorCountry = useVisitorCountry()
  const localeCountry = resolveDefaultPhoneCountry(locale)
  const [selectedCountry, setSelectedCountry] = useState(localeCountry)
  const searchCountryLabel = useTranslation('phoneInput.searchCountry', 'Search country')

  // Apply geo default after mount (and when locale changes) while the field is empty.
  useEffect(() => {
    if (!normalizePhoneInputValue(value)) {
      setSelectedCountry(visitorCountry ?? localeCountry)
    }
  }, [visitorCountry, localeCountry, value])

  const handleChange = (phone: string, data: CountryData) => {
    const countryCode = resolveCountryFromData(data)
    if (countryCode) {
      setSelectedCountry(countryCode)
    }
    onChange(phone)
  }

  const handleMount = (
    _formattedValue: string,
    data: CountryData,
    _formattedNumber: string,
  ) => {
    const countryCode = resolveCountryFromData(data)
    if (countryCode) {
      setSelectedCountry(countryCode)
    }
  }

  return (
    <PhoneInput
      autoFormat
      country={selectedCountry}
      countryCodeEditable={false}
      disableSearchIcon
      disabled={disabled}
      enableSearch
      inputProps={{
        id,
        name,
        onBlur,
      }}
      containerClass={cn(
        'app-phone-input',
        variant === 'contact' ? 'app-phone-input--contact' : 'app-phone-input--holiday',
        invalid && 'app-phone-input--invalid',
        className,
      )}
      placeholder={placeholder}
      preferredCountries={PREFERRED_COUNTRIES}
      searchPlaceholder={searchCountryLabel}
      specialLabel=""
      isValid={
        showValidation
          ? (phoneValue, country) =>
              validatePhoneInputValue(phoneValue, country as { dialCode?: string })
          : true
      }
      value={normalizePhoneInputValue(value)}
      onChange={handleChange}
      onMount={handleMount}
    />
  )
}
