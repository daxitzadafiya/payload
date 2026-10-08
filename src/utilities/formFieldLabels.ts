export const FIELD_LABEL_KEYS: Record<string, { key: string; fallback: string }> = {
  'full-name': { key: 'form.field.fullName', fallback: 'Full name' },
  forename: { key: 'form.field.firstName', fallback: 'First name' },
  first_name: { key: 'form.field.firstName', fallback: 'First name' },
  'first-name': { key: 'form.field.firstName', fallback: 'First name' },
  firstname: { key: 'form.field.firstName', fallback: 'First name' },
  surname: { key: 'form.field.lastName', fallback: 'Last name' },
  last_name: { key: 'form.field.lastName', fallback: 'Last name' },
  'last-name': { key: 'form.field.lastName', fallback: 'Last name' },
  lastname: { key: 'form.field.lastName', fallback: 'Last name' },
  email: { key: 'form.field.email', fallback: 'Email' },
  phone: { key: 'form.field.phone', fallback: 'Phone number' },
  mobile: { key: 'form.field.phone', fallback: 'Phone number' },
  mobile_phone: { key: 'form.field.phone', fallback: 'Phone number' },
  'phone-number': { key: 'form.field.phone', fallback: 'Phone number' },
  phone_number: { key: 'form.field.phone', fallback: 'Phone number' },
  subject: { key: 'form.field.subject', fallback: 'Subject' },
  message: { key: 'form.field.message', fallback: 'Message' },
  property: { key: 'form.field.property', fallback: 'Property' },
  guests: { key: 'form.field.guests', fallback: 'Guests' },
  arrival: { key: 'form.field.arrival', fallback: 'Arrival Date and time' },
  departure: { key: 'form.field.departure', fallback: 'Departure Date and time' },
  language: { key: 'form.field.language', fallback: 'Language' },
  submissionLocale: { key: 'form.field.language', fallback: 'Language' },
  enquiry_type: { key: 'form.field.enquiryType', fallback: 'Enquiry type' },
  price: { key: 'form.field.price', fallback: 'Price' },
  prop_ref: { key: 'form.field.propRef', fallback: 'Prop. Ref' },
  search_criteria: { key: 'form.field.searchCriteria', fallback: 'Search criteria' },
  save_search: { key: 'form.field.saveSearch', fallback: 'Save search' },
}

export function normalizeFieldName(fieldName: string): string {
  return fieldName.trim().toLowerCase().replace(/-/g, '_')
}

function resolveKnownFieldLabel(fieldName: string): { key: string; fallback: string } | undefined {
  return (
    FIELD_LABEL_KEYS[fieldName] ??
    FIELD_LABEL_KEYS[normalizeFieldName(fieldName)] ??
    FIELD_LABEL_KEYS[fieldName.trim().toLowerCase()]
  )
}

export function getFieldLabelMapping(
  fieldName: string,
  labelFromForm?: string,
): { key: string; fallback: string } {
  const mapped = resolveKnownFieldLabel(fieldName)
  if (mapped) return mapped

  const fallback = labelFromForm?.trim() || fieldName
  return {
    key: `form.field.${normalizeFieldName(fieldName)}.label`,
    fallback,
  }
}

export function getEmailFieldLabelMapping(
  fieldName: string,
  labelFromForm?: string,
): { key: string; fallback: string } {
  const mapped = resolveKnownFieldLabel(fieldName)
  if (mapped) {
    return {
      key: mapped.key.replace(/^form\.field\./, 'email.notification.field.'),
      fallback: mapped.fallback,
    }
  }

  const fallback = labelFromForm?.trim() || fieldName
  return {
    key: `email.notification.formField.${normalizeFieldName(fieldName)}`,
    fallback,
  }
}

export function getFieldRequiredValidationMapping(
  fieldName: string,
  labelFromForm?: string,
): { key: string; fallback: string } {
  const { fallback: labelFallback } = getFieldLabelMapping(fieldName, labelFromForm)

  return {
    key: `form.validation.${normalizeFieldName(fieldName)}.required`,
    fallback: `${labelFallback} is required`,
  }
}

export function getFieldInvalidEmailValidationMapping(fieldName: string): {
  key: string
  fallback: string
} {
  return {
    key: `form.validation.${normalizeFieldName(fieldName)}.invalidEmail`,
    fallback: 'Please enter a valid email address',
  }
}

export function getFieldInvalidPhoneValidationMapping(fieldName: string): {
  key: string
  fallback: string
} {
  const mapped = resolveKnownFieldLabel(fieldName)
  const label = mapped?.fallback ?? 'Phone number'

  return {
    key: `form.validation.${normalizeFieldName(fieldName)}.invalidPhone`,
    fallback: `Please enter a valid ${label.toLowerCase()}`,
  }
}
