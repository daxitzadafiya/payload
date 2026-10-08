'use client'

import { useEffect, useState } from 'react'

import type { ContactOfficeLocation } from '@/utilities/contactOfficeLocations'

export type MarkerViewportPosition = {
  x: number
  y: number
  placeAbove: boolean
}

const HEADER_SAFE_ZONE = 88
const POPUP_ESTIMATED_HEIGHT = 360
const POPUP_ESTIMATED_WIDTH = 160
const VIEWPORT_EDGE_PADDING = 16

function clampPopupPosition(x: number, y: number, placeAbove: boolean): MarkerViewportPosition {
  const maxX = window.innerWidth - POPUP_ESTIMATED_WIDTH - VIEWPORT_EDGE_PADDING
  const minX = POPUP_ESTIMATED_WIDTH + VIEWPORT_EDGE_PADDING
  const clampedX = Math.min(Math.max(x, minX), maxX)

  const minY = HEADER_SAFE_ZONE + (placeAbove ? POPUP_ESTIMATED_HEIGHT : 24)
  const maxY = window.innerHeight - VIEWPORT_EDGE_PADDING
  const clampedY = Math.min(Math.max(y, minY), maxY)
  const clampedPlaceAbove = clampedY - POPUP_ESTIMATED_HEIGHT > HEADER_SAFE_ZONE

  return { x: clampedX, y: clampedY, placeAbove: clampedPlaceAbove }
}

export function getLocationKey(location: ContactOfficeLocation): string {
  return location.id ?? `${location.lat},${location.lon}`
}

export function useMarkerViewportPosition(
  map: google.maps.Map | null,
  lat: number,
  lng: number,
  enabled: boolean,
): MarkerViewportPosition | null {
  const [position, setPosition] = useState<MarkerViewportPosition | null>(null)

  useEffect(() => {
    if (!map || !enabled) {
      setPosition(null)
      return
    }

    let cancelled = false
    const overlay = new google.maps.OverlayView()

    const updatePosition = () => {
      if (cancelled) return

      const projection = overlay.getProjection()
      if (!projection) return

      const point = projection.fromLatLngToContainerPixel(new google.maps.LatLng(lat, lng))
      if (!point) return

      const mapRect = map.getDiv().getBoundingClientRect()
      const mapInViewport =
        mapRect.bottom > HEADER_SAFE_ZONE &&
        mapRect.top < window.innerHeight &&
        mapRect.right > 0 &&
        mapRect.left < window.innerWidth

      // Hide while the map (or its pin) is scrolled off-screen — avoid clamping a
      // detached popup over other page sections.
      if (!mapInViewport) {
        setPosition(null)
        return
      }

      const x = mapRect.left + point.x
      const y = mapRect.top + point.y
      const visibleTop = Math.max(mapRect.top, HEADER_SAFE_ZONE)
      const visibleBottom = Math.min(mapRect.bottom, window.innerHeight)
      const visibleLeft = Math.max(mapRect.left, 0)
      const visibleRight = Math.min(mapRect.right, window.innerWidth)

      if (x < visibleLeft || x > visibleRight || y < visibleTop || y > visibleBottom) {
        setPosition(null)
        return
      }

      const placeAbove = y - POPUP_ESTIMATED_HEIGHT > HEADER_SAFE_ZONE

      setPosition(clampPopupPosition(x, y, placeAbove))
    }

    overlay.onAdd = updatePosition
    overlay.draw = updatePosition
    overlay.onRemove = () => {}
    overlay.setMap(map)

    const idleListener = map.addListener('idle', updatePosition)
    const boundsListener = map.addListener('bounds_changed', updatePosition)
    const zoomListener = map.addListener('zoom_changed', updatePosition)

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      cancelled = true
      google.maps.event.removeListener(idleListener)
      google.maps.event.removeListener(boundsListener)
      google.maps.event.removeListener(zoomListener)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      overlay.setMap(null)
    }
  }, [enabled, lat, lng, map])

  return position
}
