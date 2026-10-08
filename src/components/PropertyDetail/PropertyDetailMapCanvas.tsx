'use client'

import React, { useEffect } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'

import { loadOfficeLocationMarkerIcons } from '@/components/OfficeLocationsMap/officeLocationMarkerIcon'
import { useFaviconSource } from '@/hooks/useFaviconSource'
import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import { toGoogleHl } from '@/utilities/googleLocale'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'

type Props = {
  latitude: number
  longitude: number
}

const PropertyMarker: React.FC<Props & { faviconSrc: string }> = ({
  latitude,
  longitude,
  faviconSrc,
}) => {
  const map = useMap()

  useEffect(() => {
    if (!map || !faviconSrc) return

    let marker: google.maps.Marker | null = null
    let cancelled = false

    void loadOfficeLocationMarkerIcons(faviconSrc).then((icons) => {
      if (cancelled) return

      marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        icon: icons.defaultIcon,
        zIndex: 1,
      })
    })

    return () => {
      cancelled = true
      marker?.setMap(null)
    }
  }, [faviconSrc, latitude, longitude, map])

  return null
}

const MapContent: React.FC<Props> = ({ latitude, longitude }) => {
  const faviconSrc = useFaviconSource()

  return (
    <Map
      defaultCenter={{ lat: latitude, lng: longitude }}
      defaultZoom={14}
      gestureHandling="cooperative"
      disableDefaultUI={false}
      fullscreenControl={false}
      mapTypeControl={false}
      streetViewControl={false}
      className="h-full w-full"
    >
      <PropertyMarker faviconSrc={faviconSrc} latitude={latitude} longitude={longitude} />
    </Map>
  )
}

export const PropertyDetailMapCanvas: React.FC<Props> = ({ latitude, longitude }) => {
  const deferredLocale = useDeferredSiteLocale()
  const { settings: integrations } = useIntegrationsSettings()
  const mapsApiKey = integrations.googleMapsApiKey || ''

  if (!deferredLocale || !mapsApiKey) {
    return <div className="flex h-full w-full items-center justify-center bg-surface-container-low" />
  }

  return (
    <APIProvider
      key={deferredLocale}
      apiKey={mapsApiKey}
      libraries={['marker']}
      language={toGoogleHl(deferredLocale)}
    >
      <MapContent latitude={latitude} longitude={longitude} />
    </APIProvider>
  )
}
