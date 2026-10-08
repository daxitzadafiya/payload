'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import {
  getFieldInvalidEmailValidationMapping,
  getFieldInvalidPhoneValidationMapping,
  getFieldLabelMapping,
  getFieldRequiredValidationMapping,
} from '@/utilities/formFieldLabels'
import {
  HOLIDAY_SELECT_DATES_LABEL,
  PRICE_ON_DEMAND_LABEL,
} from '@/utilities/crmHoliday'
import {
  localizePropertyPrice,
  PRICE_ON_REQUEST_LABEL,
  type PropertyPriceLabels,
} from '@/utilities/localizePropertyPrice'
import {
  getTranslationSnapshot,
  isTranslationResolved,
  requestTranslation,
  subscribe,
} from '@/utilities/translationStore'
import { useSiteLocale } from '@/utilities/useSiteLocale'

/** Stable translation keys for CMS filter option values (matches existing Translations collection keys). */
export function filterOptionTranslationKey(keyPrefix: string, value: string): string {
  if (value === '') {
    if (keyPrefix === 'propertyList.filters.deliveryDate') {
      return `${keyPrefix}.empty`
    }
    if (keyPrefix === 'propertyList.filters.distanceToSea') {
      return `${keyPrefix}.empty`
    }
    return `${keyPrefix}.empty`
  }

  if (keyPrefix === 'propertyList.filters.deliveryDate' && value === '1') {
    return `${keyPrefix}.handover`
  }

  if (keyPrefix === 'propertyList.filters.distanceToSea' && value === '1000000') {
    return `${keyPrefix}.indifferent`
  }

  if (
    (keyPrefix === 'propertyList.filters.bedrooms' ||
      keyPrefix === 'propertyList.filters.bathrooms') &&
    value === 'other'
  ) {
    return `${keyPrefix}.needMore`
  }

  return `${keyPrefix}.${value}`
}

export async function tClient(
  key: string,
  language: string,
  fallbackValue: string,
): Promise<string> {
  const lang = language.trim().toLowerCase() || 'en'

  if (isTranslationResolved(key, lang)) {
    return getTranslationSnapshot(key, lang, fallbackValue)
  }

  requestTranslation(key, lang, fallbackValue)

  if (isTranslationResolved(key, lang)) {
    return getTranslationSnapshot(key, lang, fallbackValue)
  }

  return new Promise((resolve) => {
    const unsubscribe = subscribe(() => {
      if (!isTranslationResolved(key, lang)) return
      resolve(getTranslationSnapshot(key, lang, fallbackValue))
      unsubscribe()
    })
  })
}

export function useTranslation(key: string, fallbackValue: string): string {
  const locale = useSiteLocale()

  useEffect(() => {
    requestTranslation(key, locale, fallbackValue)
  }, [key, locale, fallbackValue])

  return useSyncExternalStore(
    subscribe,
    () => getTranslationSnapshot(key, locale, fallbackValue),
    () => fallbackValue,
  )
}

/** Labels for CRM/holiday price strings composed in English. */
export function usePropertyPriceLabels(): PropertyPriceLabels {
  return {
    priceOnDemand: useTranslation('propertyList.card.priceOnDemand', PRICE_ON_DEMAND_LABEL),
    priceOnRequest: useTranslation('propertyList.card.priceOnRequest', PRICE_ON_REQUEST_LABEL),
    selectDatesForPrice: useTranslation(
      'propertyList.card.selectDatesForPrice',
      HOLIDAY_SELECT_DATES_LABEL,
    ),
    from: useTranslation('propertyList.card.priceFromLabel', 'From'),
    perNight: useTranslation('propertyList.card.perNight', '/night'),
    perMonth: useTranslation('propertyList.card.perMonth', 'per month'),
    perYear: useTranslation('propertyList.card.perYear', 'per year'),
    nights: useTranslation('propertyDetail.holiday.nights', 'nights'),
    guests: useTranslation('propertyList.card.guestsUnit', 'guests'),
    perPersonPerNight: useTranslation(
      'propertyDetail.holiday.perPersonPerNightShort',
      'per person / night',
    ),
  }
}

export function useLocalizedPropertyPrice(price?: string): string {
  const labels = usePropertyPriceLabels()
  return localizePropertyPrice(price, labels)
}

export function useFormFieldLabel(fieldName: string, labelFromForm?: string): string {
  const { key, fallback } = getFieldLabelMapping(fieldName, labelFromForm)
  return useTranslation(key, fallback)
}

export function useFormFieldRequiredMessage(fieldName: string, labelFromForm?: string): string {
  const { key, fallback } = getFieldRequiredValidationMapping(fieldName, labelFromForm)
  return useTranslation(key, fallback)
}

export function useFormFieldInvalidEmailMessage(fieldName: string): string {
  const { key, fallback } = getFieldInvalidEmailValidationMapping(fieldName)
  return useTranslation(key, fallback)
}

export function useFormFieldInvalidPhoneMessage(fieldName: string): string {
  const { key, fallback } = getFieldInvalidPhoneValidationMapping(fieldName)
  return useTranslation(key, fallback)
}

function mapTranslatedOptions<T extends { value: string; label: string }>(
  options: readonly T[],
  keyPrefix: string,
  locale: string,
): T[] {
  return options.map((opt) => ({
    ...opt,
    label: getTranslationSnapshot(
      filterOptionTranslationKey(keyPrefix, opt.value),
      locale,
      opt.label,
    ),
  })) as T[]
}

/** Translate a list of CMS filter options using the same store as useTranslation. */
export function useTranslatedOptions<T extends { value: string; label: string }>(
  options: readonly T[],
  keyPrefix: string,
): T[] {
  const locale = useSiteLocale()
  const [translated, setTranslated] = useState<T[]>(() =>
    mapTranslatedOptions(options, keyPrefix, locale),
  )

  useEffect(() => {
    setTranslated(mapTranslatedOptions(options, keyPrefix, locale))

    for (const opt of options) {
      requestTranslation(filterOptionTranslationKey(keyPrefix, opt.value), locale, opt.label)
    }

    return subscribe(() => {
      setTranslated(mapTranslatedOptions(options, keyPrefix, locale))
    })
  }, [options, keyPrefix, locale])

  return translated
}
