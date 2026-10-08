'use client'

import React from 'react'

import { DefaultCountrySelect } from './DefaultCountrySelect'
import { SyncCountriesButton } from './SyncCountriesButton'

/** Toolbar above the Countries list: sync + default-country picker. */
export function CountriesListToolbar() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 12,
      }}
    >
      <SyncCountriesButton />
      <DefaultCountrySelect />
    </div>
  )
}
