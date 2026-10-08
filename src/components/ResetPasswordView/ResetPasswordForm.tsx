'use client'

import {
  ConfirmPasswordField,
  Form,
  FormSubmit,
  HiddenField,
  PasswordField,
  useAuth,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import type { FormState } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { useRouter } from 'next/navigation'
import React from 'react'

import { FormHeader } from '../ForgotPasswordView/FormHeader'

type ResetPasswordFormProps = {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const { config } = useConfig()
  const {
    admin: {
      routes: { login: loginRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
  } = config
  const history = useRouter()
  const { fetchFullUser } = useAuth()

  const onSuccess = React.useCallback(async () => {
    const user = await fetchFullUser()

    if (user) {
      history.push(adminRoute)
    } else {
      history.push(
        formatAdminURL({
          adminRoute,
          path: loginRoute,
        }),
      )
    }
  }, [adminRoute, fetchFullUser, history, loginRoute])

  const initialState: FormState = {
    'confirm-password': {
      initialValue: '',
      valid: false,
      value: '',
    },
    password: {
      initialValue: '',
      valid: false,
      value: '',
    },
    token: {
      initialValue: token,
      valid: true,
      value: token,
    },
  }

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/reset-password`,
      })}
      initialState={initialState}
      method="POST"
      onSuccess={onSuccess}
    >
      <FormHeader heading={t('authentication:resetPassword')} />
      <div className="inputWrap">
        <PasswordField
          field={{
            name: 'password',
            label: t('authentication:newPassword'),
            required: true,
          }}
          path="password"
          schemaPath={`${userSlug}.password`}
        />
        <ConfirmPasswordField />
        <HiddenField path="token" schemaPath={`${userSlug}.token`} value={token} />
      </div>
      <FormSubmit size="large">{t('authentication:resetPassword')}</FormSubmit>
    </Form>
  )
}
