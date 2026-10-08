import type { AdminViewServerProps } from 'payload'

import { Button, Link } from '@payloadcms/ui'
import { Translation } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { AdminBrandLogo } from '@/components/AdminBrandLogo'
import AuthPageVectors from '@/components/AuthPageVectors'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { FormHeader } from './FormHeader'

export default async function ForgotPasswordView({
  initPageResult,
}: AdminViewServerProps) {
  const {
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
  } = initPageResult

  const {
    admin: {
      routes: { account: accountRoute, login: loginRoute },
    },
    routes: { admin: adminRoute },
  } = config

  if (user) {
    return (
      <>
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
      </>
    )
  }

  return (
    <>
      <AuthPageVectors />
      <AdminBrandLogo payload={payload} />
      <ForgotPasswordForm />
      <Link
        href={formatAdminURL({
          adminRoute,
          path: loginRoute,
        })}
        prefetch={false}
      >
        {i18n.t('authentication:backToLogin')}
      </Link>
    </>
  )
}
