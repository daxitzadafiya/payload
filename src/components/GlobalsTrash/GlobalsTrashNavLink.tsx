'use client'

import React from 'react'
import Link from 'next/link'
import { useConfig } from '@payloadcms/ui'

import { GLOBALS_TRASH_PATH } from '@/plugins/trashAndVersions/constants'

export function GlobalsTrashNavLink() {
  const { config } = useConfig()
  const href = `${config.routes.admin}${GLOBALS_TRASH_PATH}`

  return (
    <Link
      className="nav__link"
      href={href}
      id="nav-globals-trash"
      style={{ display: 'block', padding: '0.5rem 0' }}
    >
      Globals Trash
    </Link>
  )
}
