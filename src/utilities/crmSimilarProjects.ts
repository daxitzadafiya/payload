import {
  fetchCRMProjects,
  normalizeCRMProject,
  type NormalizedCRMProject,
  type ProjectListFilters,
} from '@/utilities/crmProjects'

const pickIdentifier = (candidate: unknown): string | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
  if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  return undefined
}

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** Resolve a constructions list price for similar-project range matching. */
export const resolveSimilarProjectPrice = (project: Record<string, unknown>): number =>
  pickNumber(project.phase_low_price_from) ??
  pickNumber(project.price_from) ??
  pickNumber(project.current_price) ??
  pickNumber(project.price) ??
  0

const pickCityFilterKey = (project: Record<string, unknown>): string | undefined => {
  const cityKey = pickIdentifier(project.city_key)
  if (cityKey) return cityKey

  const city = project.city
  if (typeof city === 'number' && Number.isFinite(city)) return String(city)
  if (typeof city === 'string' && /^\d+$/.test(city.trim())) return city.trim()

  return undefined
}

const pickTypeFilterKey = (project: Record<string, unknown>): string | undefined => {
  const typeKey =
    pickNumber(project.type) ??
    pickNumber(project.type_one) ??
    pickNumber(project.type_one_key)
  return typeKey != null ? String(typeKey) : undefined
}

export const isSameCRMProject = (
  candidate: Record<string, unknown>,
  project: Record<string, unknown>,
): boolean => {
  const currentId = pickIdentifier(project._id) ?? pickIdentifier(project.id)
  const candidateId = pickIdentifier(candidate._id) ?? pickIdentifier(candidate.id)

  if (currentId && candidateId && currentId === candidateId) return true

  const currentReference = pickIdentifier(project.reference)
  const candidateReference = pickIdentifier(candidate.reference)

  return Boolean(currentReference && candidateReference && currentReference === candidateReference)
}

const mergeUniqueProjects = (
  primary: Record<string, unknown>[],
  secondary: Record<string, unknown>[],
  current: Record<string, unknown>,
  limit: number,
): Record<string, unknown>[] => {
  const merged: Record<string, unknown>[] = []
  const seen = new Set<string>()

  for (const candidate of [...primary, ...secondary]) {
    if (isSameCRMProject(candidate, current)) continue
    const key =
      pickIdentifier(candidate._id) ??
      pickIdentifier(candidate.id) ??
      pickIdentifier(candidate.reference)
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(candidate)
    if (merged.length >= limit) break
  }

  return merged
}

/**
 * Similar projects for project detail — same Roumpos spirit as similar properties:
 * constructions list, price band around phase_low, optional city/type, exclude current.
 * Falls back to a broader list query so we can fill up to `limit` (default 5).
 */
export async function fetchCRMSimilarProjects({
  project,
  limit = 5,
  locale = 'en',
  signal,
}: {
  project: Record<string, unknown>
  limit?: number
  locale?: string
  signal?: AbortSignal
}): Promise<NormalizedCRMProject[]> {
  const resolvedLimit = Math.max(1, limit)
  const requestLimit = Math.max(resolvedLimit + 1, 8)

  const price = resolveSimilarProjectPrice(project)
  const priceMax = price > 0 ? price + (25 * price) / 100 : 0
  const priceMin = price > 0 ? Math.max(0, price - (10 * price) / 100) : 0

  const cityKey = pickCityFilterKey(project)
  const typeKey = pickTypeFilterKey(project)

  const tightFilters: ProjectListFilters = {
    ...(cityKey ? { city: [cityKey] } : {}),
    ...(typeKey ? { propertyType: [typeKey] } : {}),
    ...(priceMin > 0 ? { minPrice: String(Math.floor(priceMin)) } : {}),
    ...(priceMax > 0 ? { maxPrice: String(Math.ceil(priceMax)) } : {}),
  }

  const { properties: tightResults } = await fetchCRMProjects({
    page: 1,
    pageSize: requestLimit,
    locale,
    signal,
    filters: tightFilters,
  })

  let combined = mergeUniqueProjects(tightResults, [], project, resolvedLimit)

  if (combined.length < resolvedLimit) {
    const { properties: broadResults } = await fetchCRMProjects({
      page: 1,
      pageSize: requestLimit,
      locale,
      signal,
      filters: {
        ...(priceMin > 0 ? { minPrice: String(Math.floor(priceMin)) } : {}),
        ...(priceMax > 0 ? { maxPrice: String(Math.ceil(priceMax)) } : {}),
      },
    })
    combined = mergeUniqueProjects(tightResults, broadResults, project, resolvedLimit)
  }

  if (combined.length < resolvedLimit) {
    const { properties: openResults } = await fetchCRMProjects({
      page: 1,
      pageSize: requestLimit,
      locale,
      signal,
      filters: {},
    })
    combined = mergeUniqueProjects(combined, openResults, project, resolvedLimit)
  }

  return combined.map((row) => normalizeCRMProject(row, locale))
}
