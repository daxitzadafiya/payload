'use client'

import {
  EmailField,
  Form,
  type FormProps,
  FormSubmit,
  TextField,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import type { FormState, PayloadRequest } from 'payload'
import { email, formatAdminURL, text } from 'payload/shared'
import React, { useState } from 'react'

import { FormHeader } from './FormHeader'

export function ForgotPasswordForm() {
  const { config, getEntityConfig } = useConfig()
  const {
    admin: { user: userSlug },
    routes: { api: apiRoute },
  } = config
  const { t } = useTranslation()
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })
  const loginWithUsername = collectionConfig?.auth?.loginWithUsername

  const handleResponse: FormProps['handleResponse'] = (res, successToast, errorToast) => {
    res
      .json()
      .then(() => {
        setHasSubmitted(true)
        successToast(t('general:submissionSuccessful'))
      })
      .catch(() => {
        errorToast(
          loginWithUsername
            ? t('authentication:usernameNotValid')
            : t('authentication:emailNotValid'),
        )
      })
  }

  const initialState: FormState = loginWithUsername
    ? {
        username: {
          initialValue: '',
          valid: true,
          value: undefined,
        },
      }
    : {
        email: {
          initialValue: '',
          valid: true,
          value: undefined,
        },
      }

  if (hasSubmitted) {
    return (
      <FormHeader
        description={t('authentication:checkYourEmailForPasswordReset')}
        heading={t('authentication:emailSent')}
      />
    )
  }

  const req = { payload: { config }, t } as unknown as PayloadRequest

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/forgot-password`,
      })}
      handleResponse={handleResponse}
      initialState={initialState}
      method="POST"
    >
      <FormHeader
        description={
          loginWithUsername
            ? t('authentication:forgotPasswordUsernameInstructions')
            : t('authentication:forgotPasswordEmailInstructions')
        }
        heading={t('authentication:forgotPassword')}
      />
      {loginWithUsername ? (
        <TextField
          field={{
            name: 'username',
            label: t('authentication:username'),
            required: true,
          }}
          path="username"
          validate={(value) =>
            text(value, {
              name: 'username',
              type: 'text',
              blockData: {},
              data: {},
              event: 'onChange',
              path: ['username'],
              preferences: { fields: {} },
              req,
              required: true,
              siblingData: {},
            })
          }
        />
      ) : (
        <EmailField
          field={{
            name: 'email',
            admin: {
              autoComplete: 'email',
            },
            label: t('general:email'),
            required: true,
          }}
          path="email"
          validate={(value) =>
            email(value, {
              name: 'email',
              type: 'email',
              blockData: {},
              data: {},
              event: 'onChange',
              path: ['email'],
              preferences: { fields: {} },
              req,
              required: true,
              siblingData: {},
            })
          }
        />
      )}
      <FormSubmit size="large">{t('general:submit')}</FormSubmit>
    </Form>
  )
}
