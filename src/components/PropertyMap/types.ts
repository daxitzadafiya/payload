import type { MapPropertyPoint } from '@/utilities/crmPropertyMap'
import type { PropertyMapSettings } from '@/utilities/getPropertyMapSettings'

export type PropertyMapViewProps = {
  points: MapPropertyPoint[]
  settings: PropertyMapSettings
  loading?: boolean
  onMarkerClick?: (point: MapPropertyPoint) => void
  onDrawApply?: (references: string[]) => void
}

export type DrawMode = 'idle' | 'drawing' | 'drawn'
