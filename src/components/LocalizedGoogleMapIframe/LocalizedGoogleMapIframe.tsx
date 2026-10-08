'use client'

import React, { useMemo } from 'react'

import { withGoogleMapLocale } from '@/utilities/googleLocale'

type Props = {
  mapUrl: string
  locale: string
  title?: string
  height?: number | null
  className?: string
}

export const LocalizedGoogleMapIframe: React.FC<Props> = ({
  mapUrl,
  locale,
  title = 'Map',
  height = 500,
  className = 'w-full border-0',
}) => {
  const localizedMapUrl = useMemo(
    () => withGoogleMapLocale(mapUrl, locale),
    [mapUrl, locale],
  )

  return (
    <iframe
      allowFullScreen
      className={className}
      key={localizedMapUrl}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={localizedMapUrl}
      style={height == null ? { height: '100%' } : { height }}
      title={title}
    />
  )
}
