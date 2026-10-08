'use client'

import React, { createContext, useContext, useLayoutEffect } from 'react'

export type PropertyListInitialData = {
  page: number
  properties: Record<string, unknown>[]
  total: number
  sort: string
  preloadImageUrls?: string[]
  listingKey?: string
}

export type PropertyListServerDataPayload = {
  listingKey: string
  data: PropertyListInitialData
}

const SetPropertyListServerDataContext = createContext<
  ((payload: PropertyListServerDataPayload) => void) | null
>(null)

export function PropertyListServerDataProvider({
  onServerData,
  children,
}: {
  onServerData: (payload: PropertyListServerDataPayload) => void
  children: React.ReactNode
}) {
  return (
    <SetPropertyListServerDataContext.Provider value={onServerData}>
      {children}
    </SetPropertyListServerDataContext.Provider>
  )
}

export function PropertyListServerDataSync({
  listingKey,
  initialData,
}: {
  listingKey: string
  initialData: PropertyListInitialData
}) {
  const setServerData = useContext(SetPropertyListServerDataContext)

  useLayoutEffect(() => {
    setServerData?.({ listingKey, data: initialData })
  }, [initialData, listingKey, setServerData])

  return null
}
