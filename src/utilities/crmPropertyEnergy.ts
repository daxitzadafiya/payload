/** Canonical English labels — translate at display via `useTranslation`. */
export const ENERGY_NOT_AVAILABLE_LABEL = 'Not available'
export const ENERGY_PENDING_LABEL = 'Pending'

/** CRM values that skip the A–G scale (matches legacy PHP `$exceptEnergyTypes`). */
const EXCEPT_ENERGY_TYPES = new Set(
  [
    'x',
    'not available',
    'exempt',
    'pending',
    'in process',
    'no disponible',
    'no indicado',
  ].map((v) => v.toLowerCase()),
)

const ENERGY_FIELD_KEYS = [
  'energy_certificate_one',
  'energy_certificate_two',
  'energy_rating',
  'epc_rating',
  'kilowatt',
  'energy_consumption',
  'epc_consumption',
  'co2',
  'co2_emissions',
  'epc_emissions',
] as const

const isPlaceholderValue = (value: string): boolean =>
  EXCEPT_ENERGY_TYPES.has(value.trim().toLowerCase())

const hasRawEnergyField = (property: Record<string, unknown>): boolean =>
  ENERGY_FIELD_KEYS.some((key) => {
    const value = property[key]
    if (value == null) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'number') return Number.isFinite(value)
    return false
  })

const STANDARD_GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
export type EnergyGrade = (typeof STANDARD_GRADES)[number]

export type CRMPropertyEnergy = {
  /** Raw CRM certificate value (e.g. A, A+, Not available). */
  certificate?: string
  /** Grade highlighted on the A–G scale (A+ maps to A). */
  activeGrade?: EnergyGrade
  /** Label for the status row (e.g. A+ while activeGrade is A). */
  displayGrade?: string
  consumption?: number | string
  emissions?: number | string
  /** Shown instead of the scale when certificate is an exception (e.g. Pending). */
  statusMessage?: string
  isEmpty: boolean
}

const pickString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || isPlaceholderValue(trimmed)) return undefined
    return trimmed
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

const pickMetric = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || isPlaceholderValue(trimmed)) return undefined
    return trimmed
  }
  return undefined
}

const normalizeCertificate = (certificate: string): string => certificate.trim()

const toActiveGrade = (certificate: string): EnergyGrade | undefined => {
  const normalized = normalizeCertificate(certificate).toUpperCase()
  const grade = normalized === 'A+' ? 'A' : normalized
  return STANDARD_GRADES.includes(grade as EnergyGrade) ? (grade as EnergyGrade) : undefined
}

const resolveStatusMessage = (certificate: string): string | undefined => {
  const normalized = normalizeCertificate(certificate)
  const lower = normalized.toLowerCase()

  if (lower === 'not available' || lower === 'x') return ENERGY_PENDING_LABEL
  if (EXCEPT_ENERGY_TYPES.has(lower)) return normalized
  if (!toActiveGrade(normalized)) return normalized

  return undefined
}

const toDisplayGrade = (certificate: string, activeGrade: EnergyGrade): string => {
  const normalized = normalizeCertificate(certificate).toUpperCase()
  return normalized === 'A+' ? 'A+' : activeGrade
}

/**
 * Optima CRM energy fields (legacy PHP):
 * - energy_certificate_one
 * - kilowatt (consumption kWh/m² year)
 * - co2 (emissions kg CO2/m² year)
 */
export function normalizeCRMPropertyEnergy(
  property: Record<string, unknown>,
): CRMPropertyEnergy | null {
  const certificate =
    pickString(property.energy_certificate_one) ||
    pickString(property.energy_certificate_two) ||
    pickString(property.energy_rating) ||
    pickString(property.epc_rating)

  const consumption = pickMetric(
    property.kilowatt ?? property.energy_consumption ?? property.epc_consumption,
  )
  const emissions = pickMetric(property.co2 ?? property.co2_emissions ?? property.epc_emissions)

  if (!certificate && consumption == null && emissions == null) {
    if (!hasRawEnergyField(property)) return null
    return {
      certificate: ENERGY_NOT_AVAILABLE_LABEL,
      isEmpty: true,
      statusMessage: ENERGY_PENDING_LABEL,
    }
  }

  const resolvedCertificate = certificate || ENERGY_NOT_AVAILABLE_LABEL
  const activeGrade = toActiveGrade(resolvedCertificate)
  const statusMessage = resolveStatusMessage(resolvedCertificate)
  const isEmpty = !activeGrade

  return {
    certificate: resolvedCertificate,
    activeGrade,
    displayGrade: activeGrade ? toDisplayGrade(resolvedCertificate, activeGrade) : undefined,
    consumption,
    emissions,
    statusMessage: isEmpty ? statusMessage : undefined,
    isEmpty,
  }
}

export const ENERGY_GRADES = STANDARD_GRADES

export type EnergyGradeStyle = {
  color: string
  textColor: string
  /** Bar width as % of track — A shortest, G longest. */
  widthPercent: number
}

export const ENERGY_GRADE_STYLES: Record<EnergyGrade, EnergyGradeStyle> = {
  A: { color: '#008237', textColor: '#ffffff', widthPercent: 32 },
  B: { color: '#19a650', textColor: '#ffffff', widthPercent: 40 },
  C: { color: '#8dc63f', textColor: '#ffffff', widthPercent: 48 },
  D: { color: '#d9e021', textColor: '#1d1b17', widthPercent: 56 },
  E: { color: '#f7b334', textColor: '#1d1b17', widthPercent: 64 },
  F: { color: '#ed6b2d', textColor: '#ffffff', widthPercent: 72 },
  G: { color: '#e2231a', textColor: '#ffffff', widthPercent: 80 },
}
