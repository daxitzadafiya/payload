import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter, SetStepNav, ViewDescription } from '@payloadcms/ui'
import React from 'react'

import { GlobalsTrashClient } from '@/components/GlobalsTrash/GlobalsTrashClient'
import { listTrashedItemsForGlobals } from '@/plugins/trashAndVersions/endpoint'

const DESCRIPTION =
  'Items removed from globals and settings are kept here. Restore anything you deleted by mistake. Use Versions on a global edit screen to compare full saves.'

export default async function GlobalsTrashView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const { req } = initPageResult
  const { payload, user, i18n } = req

  if (!user) {
    return null
  }

  const rows = await listTrashedItemsForGlobals(req)

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={initPageResult.locale}
      params={params}
      payload={payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={initPageResult.visibleEntities}
    >
      <SetStepNav nav={[{ label: 'Globals Trash' }]} />
      <div className="collection-list">
        <Gutter className="collection-list__wrap">
          <header className="list-header">
            <div className="list-header__content">
              <div className="list-header__title-and-actions">
                <h1 className="list-header__title">Globals Trash</h1>
              </div>
            </div>
            <div className="list-header__after-header-content">
              <div className="collection-list__sub-header">
                <ViewDescription description={DESCRIPTION} />
              </div>
            </div>
          </header>
          <GlobalsTrashClient rows={rows} />
        </Gutter>
      </div>
    </DefaultTemplate>
  )
}
