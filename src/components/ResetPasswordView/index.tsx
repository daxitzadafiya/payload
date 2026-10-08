import type { AdminViewServerProps } from 'payload'

import { Button, Link } from '@payloadcms/ui'
import { Translation } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { AdminBrandLogo } from '@/components/AdminBrandLogo'
import AuthPageVectors from '@/components/AuthPageVectors'
import { FormHeader } from '../ForgotPasswordView/FormHeader'
import { ResetPasswordForm } from './ResetPasswordForm'

export default async function ResetPasswordView({
  initPageResult,
  params,
}: AdminViewServerProps) {
  const {
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
  } = initPageResult

  const segments = (params as { segments?: string[] } | undefined)?.segments
  const token = segments?.[1] ?? ''

  const {
    admin: {
      routes: { account: accountRoute, login: loginRoute },
    },
    routes: { admin: adminRoute },
  } = config

  if (user) {
    return (
      <div className="reset-password__wrap">
        <FormHeader
          description={
            <Translation
              elements={{
                '0': ({ children }) => (
                  <Link
                    href={formatAdminURL({
                      adminRoute,
                      path: accountRoute,
                    })}
                    prefetch={false}
                  >
                    {children}
                  </Link>
                ),
              }}
              i18nKey="authentication:loggedInChangePassword"
              t={i18n.t}
            />
          }
          heading={i18n.t('authentication:alreadyLoggedIn')}
        />
        <Button buttonStyle="secondary" el="link" size="large" to={adminRoute}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </div>
    )
  }

  return (
    <div className="reset-password__wrap">
      <AuthPageVectors />
      <AdminBrandLogo payload={payload} />
      <ResetPasswordForm token={token} />
      <Link
        href={formatAdminURL({
          adminRoute,
          path: loginRoute,
        })}
        prefetch={false}
      >
        {i18n.t('authentication:backToLogin')}
      </Link>
    </div>
  )
}
