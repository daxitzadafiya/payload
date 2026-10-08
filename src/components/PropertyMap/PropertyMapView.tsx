'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { APIProvider, Map } from '@vis.gl/react-google-maps'

import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import type { MapPropertyPoint } from '@/utilities/crmPropertyMap'
import type { PropertyMapSettings } from '@/utilities/getPropertyMapSettings'
import { toGoogleHl } from '@/utilities/googleLocale'
import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'

import { filterPointsInsidePolygon } from './clusterRenderer'
import { PropertyMapCluster } from './PropertyMapCluster'
import { PropertyMapDrawController } from './PropertyMapDrawController'
import { PropertyMapDrawToolbar } from './PropertyMapDrawToolbar'
import type { DrawMode } from './types'

type Props = {
  points: MapPropertyPoint[]
  settings: PropertyMapSettings
  loading?: boolean
  onMarkerClick?: (point: MapPropertyPoint) => void
  onDrawApply?: (references: string[]) => void
}

const MapContent: React.FC<Props> = ({
  points,
  settings,
  loading = false,
  onMarkerClick,
  onDrawApply,
}) => {
  const loadingLabel = useTranslation('propertyMap.loading', 'Loading properties…')
  const [drawMode, setDrawMode] = useState<DrawMode>('idle')
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  const handleStartDraw = () => {
    polygonRef.current?.setMap(null)
    polygonRef.current = null
    polylineRef.current?.setMap(null)
    polylineRef.current = null
    setDrawMode('drawing')
  }

  const handleDrawComplete = useCallback(() => {
    setDrawMode('drawn')
  }, [])

  const handleReset = () => {
    polygonRef.current?.setMap(null)
    polygonRef.current = null
    polylineRef.current?.setMap(null)
    polylineRef.current = null
    setDrawMode('idle')
  }

  const handleApply = () => {
    const references = filterPointsInsidePolygon(points, polygonRef.current)
    onDrawApply?.(references)
    handleReset()
  }

  const mapOptions = useMemo(
    () => ({
      minZoom: settings.minZoom,
      maxZoom: settings.maxZoom,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
    }),
    [settings.maxZoom, settings.minZoom],
  )

  return (
    <div className="relative h-full w-full">
      {settings.enableDrawSearch && (
        <PropertyMapDrawToolbar
          drawMode={drawMode}
          drawButtonLabel={settings.drawButtonLabel}
          drawInstructionText={settings.drawInstructionText}
          onStartDraw={handleStartDraw}
          onApply={handleApply}
          onReset={handleReset}
        />
      )}

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-surface/60 backdrop-blur-[1px]">
          <p className="font-body-md text-body-md text-on-surface-variant">{loadingLabel}</p>
        </div>
      )}

      <Map
        defaultCenter={settings.defaultCenter}
        defaultZoom={settings.defaultZoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        {...mapOptions}
        className="h-full w-full"
      >
        <PropertyMapCluster points={points} settings={settings} onMarkerClick={onMarkerClick} />
        {settings.enableDrawSearch && (
          <PropertyMapDrawController
            drawMode={drawMode}
            onDrawComplete={handleDrawComplete}
            polygonRef={polygonRef}
            polylineRef={polylineRef}
          />
        )}
      </Map>
    </div>
  )
}

export const PropertyMapView: React.FC<Props> = (props) => {
  const deferredLocale = useDeferredSiteLocale()
  const { settings: integrations } = useIntegrationsSettings()
  const mapsApiKey = integrations.googleMapsApiKey || ''

  if (!deferredLocale) {
    return <div className="relative h-full w-full bg-surface-container-low" />
  }

  const googleHl = toGoogleHl(deferredLocale)

  return (
    <APIProvider
      key={deferredLocale}
      apiKey={mapsApiKey}
      libraries={['marker', 'geometry']}
      language={googleHl}
    >
      <MapContent {...props} />
    </APIProvider>
  )
}
