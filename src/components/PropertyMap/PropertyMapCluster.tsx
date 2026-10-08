'use client'

import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'
import { useMap } from '@vis.gl/react-google-maps'
import { useEffect, useRef } from 'react'

import type { MapPropertyPoint } from '@/utilities/crmPropertyMap'
import type { PropertyMapSettings } from '@/utilities/getPropertyMapSettings'

import { createClusterMarkerIcon, createClusterRenderer } from './clusterRenderer'

type Props = {
  points: MapPropertyPoint[]
  settings: PropertyMapSettings
  onMarkerClick?: (point: MapPropertyPoint) => void
}

export const PropertyMapCluster: React.FC<Props> = ({ points, settings, onMarkerClick }) => {
  const map = useMap()
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const onMarkerClickRef = useRef(onMarkerClick)

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick
  }, [onMarkerClick])

  useEffect(() => {
    if (!map) return

    clustererRef.current?.clearMarkers()
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (!points.length) {
      clustererRef.current = null
      return
    }

    const markers = points.map((point) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        // Single-property clusters reuse this marker — avoid default red Google pin.
        icon: createClusterMarkerIcon(1, settings.clusterColors),
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 1,
      })

      marker.addListener('click', () => {
        onMarkerClickRef.current?.(point)
      })

      return marker
    })

    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      renderer: createClusterRenderer(settings.clusterColors),
      algorithm: new SuperClusterAlgorithm({ radius: 80, maxZoom: 16 }),
    })

    markersRef.current = markers

    return () => {
      clustererRef.current?.clearMarkers()
      markersRef.current.forEach((marker) => marker.setMap(null))
      clustererRef.current = null
      markersRef.current = []
    }
  }, [map, points, settings.clusterColors])

  return null
}
