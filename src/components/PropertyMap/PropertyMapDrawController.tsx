'use client'

import { useMap } from '@vis.gl/react-google-maps'
import { useEffect, useRef } from 'react'

import type { DrawMode } from './types'

type Props = {
  drawMode: DrawMode
  onDrawComplete: () => void
  polygonRef: React.MutableRefObject<google.maps.Polygon | null>
  polylineRef: React.MutableRefObject<google.maps.Polyline | null>
}

const POLYGON_OPTIONS: google.maps.PolylineOptions = {
  strokeColor: '#2563eb',
  strokeOpacity: 1,
  strokeWeight: 3,
  clickable: false,
}

const MIN_POINT_DISTANCE_METERS = 40

export const PropertyMapDrawController: React.FC<Props> = ({
  drawMode,
  onDrawComplete,
  polygonRef,
  polylineRef,
}) => {
  const map = useMap()
  const pathRef = useRef<google.maps.LatLng[]>([])
  const drawingRef = useRef(false)
  const listenersRef = useRef<google.maps.MapsEventListener[]>([])
  const onDrawCompleteRef = useRef(onDrawComplete)

  useEffect(() => {
    onDrawCompleteRef.current = onDrawComplete
  }, [onDrawComplete])

  useEffect(() => {
    if (!map) return

    const removeListeners = () => {
      listenersRef.current.forEach((listener) => listener.remove())
      listenersRef.current = []
    }

    const clearDrawing = () => {
      polylineRef.current?.setMap(null)
      polygonRef.current?.setMap(null)
      polylineRef.current = null
      polygonRef.current = null
      pathRef.current = []
      drawingRef.current = false
    }

    const restoreMapInteraction = () => {
      map.setOptions({
        draggable: true,
        draggableCursor: undefined,
        draggingCursor: undefined,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        gestureHandling: 'greedy',
      })
    }

    const lockMapForDrawing = () => {
      map.setOptions({
        draggable: false,
        draggableCursor: 'crosshair',
        draggingCursor: 'crosshair',
        scrollwheel: false,
        disableDoubleClickZoom: true,
        gestureHandling: 'none',
      })
    }

    if (drawMode === 'idle') {
      removeListeners()
      clearDrawing()
      restoreMapInteraction()
      return
    }

    if (drawMode === 'drawn') {
      removeListeners()
      restoreMapInteraction()
      return
    }

    clearDrawing()
    lockMapForDrawing()

    const shouldAddPoint = (latLng: google.maps.LatLng) => {
      const lastPoint = pathRef.current[pathRef.current.length - 1]
      if (!lastPoint) return true

      if (typeof google.maps.geometry?.spherical?.computeDistanceBetween === 'function') {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(lastPoint, latLng)
        return distance >= MIN_POINT_DISTANCE_METERS
      }

      return true
    }

    const addPoint = (latLng: google.maps.LatLng) => {
      if (!shouldAddPoint(latLng)) return

      pathRef.current.push(latLng)

      if (!polylineRef.current) {
        polylineRef.current = new google.maps.Polyline({
          ...POLYGON_OPTIONS,
          map,
          path: pathRef.current,
        })
      } else {
        polylineRef.current.setPath(pathRef.current)
      }
    }

    const finishDrawing = () => {
      if (!drawingRef.current) return

      drawingRef.current = false

      if (pathRef.current.length < 3) {
        polylineRef.current?.setMap(null)
        polylineRef.current = null
        pathRef.current = []
        return
      }

      polylineRef.current?.setMap(null)
      polylineRef.current = null

      polygonRef.current = new google.maps.Polygon({
        paths: pathRef.current,
        strokeColor: '#2563eb',
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: '#2563eb',
        fillOpacity: 0.15,
        clickable: false,
        map,
      })

      onDrawCompleteRef.current()
    }

    const onPointerDown = (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      drawingRef.current = true
      pathRef.current = []
      addPoint(e.latLng)
    }

    const onPointerMove = (e: google.maps.MapMouseEvent) => {
      if (!drawingRef.current || !e.latLng) return
      addPoint(e.latLng)
    }

    const onPointerUp = () => {
      finishDrawing()
    }

    listenersRef.current.push(map.addListener('mousedown', onPointerDown))
    listenersRef.current.push(map.addListener('mousemove', onPointerMove))
    listenersRef.current.push(map.addListener('mouseup', onPointerUp))

    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchend', onPointerUp)

    return () => {
      removeListeners()
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchend', onPointerUp)
      restoreMapInteraction()
    }
  }, [drawMode, map, polygonRef, polylineRef])

  return null
}
