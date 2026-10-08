import type { RegisterOptions } from 'react-hook-form'

import { isValidPhoneValue, normalizePhoneInputValue } from '@/utilities/phoneValidation'

type PhoneValidationOptions = {
  required?: boolean
  requiredMessage: string
  invalidPhoneMessage: string
}

function phoneDigits(value: string | null | undefined): string {
  return normalizePhoneInputValue(value).replace(/\D/g, '')
}

/** Treat auto-selected dial code only (e.g. "91") as empty. */
function isDialCodeOnly(value: string | null | undefined): boolean {
  const digits = phoneDigits(value)
  return digits.length > 0 && digits.length <= 3
}

export function buildPhoneValidationRules({
  required,
  requiredMessage,
  invalidPhoneMessage,
}: PhoneValidationOptions): RegisterOptions {
  return {
    required: required ? requiredMessage : false,
    validate: (value: string) => {
      const digits = phoneDigits(value)

      if (!digits || isDialCodeOnly(value)) {
        return required ? requiredMessage : true
      }

      return isValidPhoneValue(digits) || invalidPhoneMessage
    },
  }
}

export function validatePhoneValue(
  value: string,
  options: PhoneValidationOptions,
): string | undefined {
  const digits = phoneDigits(value)

  if (!digits || isDialCodeOnly(value)) {
    return options.required ? options.requiredMessage : undefined
  }

  if (!isValidPhoneValue(digits)) {
    return options.invalidPhoneMessage
  }

  return undefined
}
