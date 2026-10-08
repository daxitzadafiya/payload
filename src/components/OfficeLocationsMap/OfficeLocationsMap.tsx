'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'

import { OfficeLocationPopup } from '@/components/OfficeLocationsMap/OfficeLocationPopup'
import { loadOfficeLocationMarkerIcons, OFFICE_MAP_STYLES } from '@/components/OfficeLocationsMap/officeLocationMarkerIcon'
import {
  getLocationKey,
  useMarkerViewportPosition,
} from '@/components/OfficeLocationsMap/useMarkerViewportPosition'
import { useCoarsePointer } from '@/hooks/useCoarsePointer'
import { useCompactMapPopup } from '@/hooks/useCompactMapPopup'
import { useFaviconSource } from '@/hooks/useFaviconSource'
import { useIntegrationsSettings } from '@/hooks/useIntegrationsSettings'
import type { ContactOfficeLocation } from '@/utilities/contactOfficeLocations'
import { toGoogleHl } from '@/utilities/googleLocale'
import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'

type Props = {
  locations: ContactOfficeLocation[]
  center: { lat: number; lng: number }
  defaultZoom?: number | null
  height?: number | null
  title?: string
}

const CLOSE_DELAY_MS = 450
const DEFAULT_ZOOM = 6
const DEFAULT_HEIGHT = 500

function resolveMapZoom(value: unknown, fallback = DEFAULT_ZOOM): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(20, n)
}

/** Apply CMS center/zoom once the JS map is ready — do not fit to markers. */
const ApplyInitialCamera: React.FC<{
  center: { lat: number; lng: number }
  zoom: number
}> = ({ center, zoom }) => {
  const map = useMap()
  const appliedKeyRef = useRef<string | null>(null)
  const viewKey = `${center.lat},${center.lng},${zoom}`

  useEffect(() => {
    if (!map) return
    if (appliedKeyRef.current === viewKey) return

    map.setCenter({ lat: center.lat, lng: center.lng })
    map.setZoom(zoom)
    appliedKeyRef.current = viewKey
  }, [center.lat, center.lng, map, viewKey, zoom])

  return null
}

const OfficeMarkers: React.FC<{
  locations: ContactOfficeLocation[]
  faviconSrc: string
  isCoarsePointer: boolean
  pinnedLocationKey: string | null
  onLocationOpen: (location: ContactOfficeLocation, options?: { pin?: boolean }) => void
  onLocationHoverEnd: (locationKey: string) => void
  onLocationClose: () => void
  onMarkerClick: () => void
}> = ({
  locations,
  faviconSrc,
  isCoarsePointer,
  pinnedLocationKey,
  onLocationOpen,
  onLocationHoverEnd,
  onLocationClose,
  onMarkerClick,
}) => {
  const map = useMap()
  const onLocationOpenRef = useRef(onLocationOpen)
  const onLocationHoverEndRef = useRef(onLocationHoverEnd)
  const onLocationCloseRef = useRef(onLocationClose)
  const onMarkerClickRef = useRef(onMarkerClick)
  const pinnedLocationKeyRef = useRef(pinnedLocationKey)

  useEffect(() => {
    onLocationOpenRef.current = onLocationOpen
    onLocationHoverEndRef.current = onLocationHoverEnd
    onLocationCloseRef.current = onLocationClose
    onMarkerClickRef.current = onMarkerClick
    pinnedLocationKeyRef.current = pinnedLocationKey
  }, [onLocationClose, onLocationHoverEnd, onLocationOpen, onMarkerClick, pinnedLocationKey])

  useEffect(() => {
    if (!map || !locations.length || !faviconSrc) return

    let cancelled = false
    let markers: google.maps.Marker[] = []

    const setupMarkers = async () => {
      let markerIcons: { defaultIcon: google.maps.Icon; hoverIcon: google.maps.Icon }

      try {
        markerIcons = await loadOfficeLocationMarkerIcons(faviconSrc)
      } catch {
        return
      }

      if (cancelled) return

      markers = locations.map((location) => {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lon },
          map,
          icon: markerIcons.defaultIcon,
          optimized: false,
          clickable: true,
          zIndex: 1,
        })

        const locationKey = getLocationKey(location)

        const setHovered = (hovered: boolean) => {
          marker.setIcon(hovered ? markerIcons.hoverIcon : markerIcons.defaultIcon)
          marker.setZIndex(hovered ? google.maps.Marker.MAX_ZINDEX : 1)
        }

        if (!isCoarsePointer) {
          marker.addListener('mouseover', () => {
            setHovered(true)
            onLocationOpenRef.current(location)
          })

          marker.addListener('mouseout', () => {
            setHovered(false)
            onLocationHoverEndRef.current(locationKey)
          })
        }

        marker.addListener('click', () => {
          onMarkerClickRef.current()
          const isPinned = pinnedLocationKeyRef.current === locationKey

          if (isPinned) {
            setHovered(false)
            onLocationCloseRef.current()
            return
          }

          setHovered(true)
          onLocationOpenRef.current(location, { pin: true })
        })

        return marker
      })

      if (locations.length === 1 && !isCoarsePointer) {
        markers[0]?.setIcon(markerIcons.hoverIcon)
        onLocationOpenRef.current(locations[0], { pin: true })
      }
    }

    void setupMarkers()

    return () => {
      cancelled = true
      markers.forEach((marker) => marker.setMap(null))
    }
  }, [faviconSrc, isCoarsePointer, locations, map])

  return null
}

const OfficeLocationDesktopPopup: React.FC<{
  location: ContactOfficeLocation
  directionsLabel: string
  onMouseEnter: () => void
  onMouseLeave: () => void
}> = ({ location, directionsLabel, onMouseEnter, onMouseLeave }) => {
  const map = useMap()
  const position = useMarkerViewportPosition(map, location.lat, location.lon, true)

  if (!position || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-auto fixed z-[60] hidden lg:block"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        left: position.x,
        top: position.y,
        transform: position.placeAbove
          ? 'translate(-50%, calc(-100% - 14px))'
          : 'translate(-50%, 14px)',
      }}
    >
      <div className={position.placeAbove ? 'pb-4' : 'pt-4'}>
        {position.placeAbove ? (
          <>
            <OfficeLocationPopup directionsLabel={directionsLabel} location={location} />
            <div
              aria-hidden
              className="mx-auto mt-1 h-3 w-3 rotate-45 border-b border-r border-secondary/30 bg-surface-cream shadow-sm"
            />
          </>
        ) : (
          <>
            <div
              aria-hidden
              className="mx-auto mb-1 h-3 w-3 rotate-45 border-l border-t border-secondary/30 bg-surface-cream shadow-sm"
            />
            <OfficeLocationPopup directionsLabel={directionsLabel} location={location} />
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

const MapContent: React.FC<Props> = ({
  locations,
  center,
  defaultZoom,
  height = DEFAULT_HEIGHT,
}) => {
  const faviconSrc = useFaviconSource()
  const isCoarsePointer = useCoarsePointer()
  const isCompactPopup = useCompactMapPopup()
  const isTouchInteraction = isCoarsePointer || isCompactPopup
  const directionsLabel = useTranslation('mapBlock.directions', 'Directions')
  const [activeLocation, setActiveLocation] = useState<ContactOfficeLocation | null>(null)
  const [pinnedLocationKey, setPinnedLocationKey] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeLocationRef = useRef<ContactOfficeLocation | null>(null)
  const pinnedLocationKeyRef = useRef<string | null>(null)
  const suppressMapClickRef = useRef(false)
  const mapSectionRef = useRef<HTMLDivElement>(null)

  const zoom = resolveMapZoom(defaultZoom)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const openLocation = useCallback(
    (location: ContactOfficeLocation, options?: { pin?: boolean }) => {
      clearCloseTimer()
      activeLocationRef.current = location
      setActiveLocation(location)

      if (options?.pin) {
        const key = getLocationKey(location)
        pinnedLocationKeyRef.current = key
        setPinnedLocationKey(key)
      }
    },
    [clearCloseTimer],
  )

  const closeLocation = useCallback(() => {
    clearCloseTimer()
    activeLocationRef.current = null
    pinnedLocationKeyRef.current = null
    setPinnedLocationKey(null)
    setActiveLocation(null)
  }, [clearCloseTimer])

  const scheduleClose = useCallback(() => {
    if (isTouchInteraction || pinnedLocationKeyRef.current) return

    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      if (pinnedLocationKeyRef.current) return
      activeLocationRef.current = null
      setActiveLocation(null)
      closeTimerRef.current = null
    }, CLOSE_DELAY_MS)
  }, [clearCloseTimer, isTouchInteraction])

  const keepPopupOpen = useCallback(() => {
    clearCloseTimer()
    if (activeLocationRef.current) {
      setActiveLocation(activeLocationRef.current)
    }
  }, [clearCloseTimer])

  const handleMarkerHoverEnd = useCallback(
    (locationKey: string) => {
      if (pinnedLocationKeyRef.current === locationKey) return
      scheduleClose()
    },
    [scheduleClose],
  )

  const handleMarkerClick = useCallback(() => {
    suppressMapClickRef.current = true
  }, [])

  const handleMapClick = useCallback(() => {
    if (suppressMapClickRef.current) {
      suppressMapClickRef.current = false
      return
    }
    if (pinnedLocationKeyRef.current || activeLocationRef.current) {
      closeLocation()
    }
  }, [closeLocation])

  // Close pin/hover popup when the map leaves the viewport (e.g. user scrolls up).
  useEffect(() => {
    const el = mapSectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          closeLocation()
        }
      },
      { threshold: 0, rootMargin: '0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [closeLocation])

  return (
    <div
      ref={mapSectionRef}
      style={{ height: height ?? DEFAULT_HEIGHT }}
      className="relative isolate w-full overflow-hidden"
    >
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling={isTouchInteraction ? 'greedy' : 'cooperative'}
        disableDefaultUI={false}
        fullscreenControl={false}
        mapTypeControl={false}
        streetViewControl={false}
        styles={OFFICE_MAP_STYLES}
        className="h-full w-full"
        onClick={handleMapClick}
      >
        <ApplyInitialCamera center={center} zoom={zoom} />
        <OfficeMarkers
          faviconSrc={faviconSrc}
          isCoarsePointer={isTouchInteraction}
          locations={locations}
          pinnedLocationKey={pinnedLocationKey}
          onLocationClose={closeLocation}
          onLocationHoverEnd={handleMarkerHoverEnd}
          onLocationOpen={openLocation}
          onMarkerClick={handleMarkerClick}
        />
        {activeLocation && !isCompactPopup ? (
          <OfficeLocationDesktopPopup
            directionsLabel={directionsLabel}
            location={activeLocation}
            onMouseEnter={keepPopupOpen}
            onMouseLeave={scheduleClose}
          />
        ) : null}
      </Map>

      {activeLocation && isCompactPopup ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 lg:hidden">
          <div className="pointer-events-auto mx-auto w-full max-w-xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
            <OfficeLocationPopup
              directionsLabel={directionsLabel}
              location={activeLocation}
              onClose={closeLocation}
              variant="sheet"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export const OfficeLocationsMap: React.FC<Props> = (props) => {
  const deferredLocale = useDeferredSiteLocale()
  const { settings: integrations } = useIntegrationsSettings()
  const mapsApiKey = integrations.googleMapsApiKey || ''

  if (!deferredLocale) {
    return (
      <div
        style={{ height: props.height ?? DEFAULT_HEIGHT }}
        className="relative isolate w-full overflow-hidden bg-surface-container-low"
      />
    )
  }

  const googleHl = toGoogleHl(deferredLocale)

  return (
    <APIProvider
      key={deferredLocale}
      apiKey={mapsApiKey}
      libraries={['marker']}
      language={googleHl}
    >
      <MapContent {...props} />
    </APIProvider>
  )
}
