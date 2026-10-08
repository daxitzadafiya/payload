'use client'

import type { Form as FormType, FormFieldBlock } from '@payloadcms/plugin-form-builder/types'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import { getClientSideURL } from '@/utilities/getURL'
import { parseFormSubmissionError } from '@/utilities/parseFormSubmissionError'
import { useSiteLocale } from '@/utilities/useSiteLocale'

type FormSubmissionState = {
  isLoading: boolean
  hasSubmitted: boolean | undefined
  error: { message: string; status?: string } | undefined
  onSubmit: (data: FormFieldBlock[]) => void
  resetSubmission: () => void
}

type SubmissionField = {
  field: string
  value: string | boolean
}

type UseFormSubmissionOptions = {
  /**
   * When enabled, we send reCAPTCHA data along with the submission and the
   * server will verify it (see `src/plugins/index.ts`).
   */
  recaptchaRequired?: boolean
  recaptchaToken?: string
  /** Contact section: forward submission to Optima CRM accounts (see `src/plugins/index.ts`). */
  syncToOptimaCrm?: boolean
  /** Owners block: forward submission to Optima CRM owners instead of accounts. */
  syncToOptimaOwners?: boolean
  /** Extra CRM fields (e.g. property inquiry hidden inputs). */
  extraSubmissionFields?: SubmissionField[]
}

export function useFormSubmission(
  form: FormType | undefined,
  options: UseFormSubmissionOptions = {},
): FormSubmissionState {
  const {
    id: formID,
    confirmationType,
    redirect,
  } = form ?? {}

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()
  const submissionLocale = useSiteLocale()

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      if (!formID) return

      const submitForm = async () => {
        setError(undefined)
        setIsLoading(true)

        const dataToSend = [
          ...Object.entries(data as unknown as Record<string, unknown>).map(([name, value]) => ({
            field: name,
            value,
          })),
          ...(options.extraSubmissionFields ?? []),
        ]

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
              submissionLocale,
              ...(options.syncToOptimaCrm ? { syncToOptimaCrm: true } : {}),
              ...(options.syncToOptimaOwners ? { syncToOptimaOwners: true } : {}),
              ...(options.recaptchaRequired
                ? {
                    recaptchaRequired: true,
                    recaptchaToken: options.recaptchaToken || '',
                  }
                : {}),
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          if (req.status >= 400) {
            setIsLoading(false)
            setError({
              message: parseFormSubmissionError(res),
              status: String(req.status),
            })
            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const redirectUrl = redirect.url
            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [
      router,
      formID,
      redirect,
      confirmationType,
      options.recaptchaRequired,
      options.recaptchaToken,
      options.syncToOptimaCrm,
      options.syncToOptimaOwners,
      options.extraSubmissionFields,
      submissionLocale,
    ],
  )

  const resetSubmission = useCallback(() => {
    setHasSubmitted(false)
    setError(undefined)
    setIsLoading(false)
  }, [])

  return { isLoading, hasSubmitted, error, onSubmit, resetSubmission }
}

