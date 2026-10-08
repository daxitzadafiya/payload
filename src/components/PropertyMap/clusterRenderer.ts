import type { Cluster, ClusterStats } from '@googlemaps/markerclusterer'

import { SITE_THEME_TOKEN_DEFAULTS } from '@/globals/Theme/siteThemeTokens.mjs'

type ClusterColors = {
  small: string
  medium: string
  large: string
}

const CLUSTER_SIZE_THRESHOLDS = {
  medium: 10,
  large: 50,
} as const

function getThemePrimaryColor(): string {
  if (typeof window !== 'undefined') {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim()
    if (value) return value
  }
  return SITE_THEME_TOKEN_DEFAULTS.primary
}

export function getClusterStyle(count: number, _colors: ClusterColors) {
  // Same Theme primary for all marker sizes.
  const color = getThemePrimaryColor()

  const size =
    count >= CLUSTER_SIZE_THRESHOLDS.large ? 48 : count >= CLUSTER_SIZE_THRESHOLDS.medium ? 42 : 36

  return { color, size }
}

export function createClusterMarkerIcon(count: number, colors: ClusterColors): google.maps.Icon {
  const { color, size } = getClusterStyle(count, colors)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="13" font-weight="600">${count}</text>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  }
}

export function createClusterRenderer(colors: ClusterColors) {
  return {
    render: ({ count, position }: Cluster, _stats: ClusterStats, _map: google.maps.Map) => {
      return new google.maps.Marker({
        position,
        icon: createClusterMarkerIcon(count, colors),
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
      })
    },
  }
}

export function filterPointsInsidePolygon(
  points: { lat: number; lng: number; reference: string }[],
  polygon: google.maps.Polygon | null,
): string[] {
  if (!polygon) return []

  const references: string[] = []

  for (const point of points) {
    const latLng = new google.maps.LatLng(point.lat, point.lng)
    if (google.maps.geometry.poly.containsLocation(latLng, polygon)) {
      references.push(point.reference)
    }
  }

  return references
}
