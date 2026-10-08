/**
 * Converts CRM listing bodies ({ options, query }) into NestJS GET /properties query params.
 * Matches Optima GET API: status[]=…, sale=1, orderby[]=field,ASC, page_size, etc.
 *
 * POST /commercial_properties accepted Mongo-style filters (archived, has_images, etc.).
 * GET /properties only documents flat query params — drop unsupported Mongo keys.
 */
const GET_UNSUPPORTED_TOP_LEVEL_KEYS = new Set(['archived', 'has_images'])

const serializePrimitive = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (value === null || value === undefined) return ''
  return String(value)
}

const serializeCRMValue = (params: URLSearchParams, key: string, value: unknown): void => {
  if (value === null || value === undefined) return

  const isLogicalOperatorArrayKey =
    key === '$and' ||
    key === '$or' ||
    key === '$nor' ||
    key.endsWith('[$and]') ||
    key.endsWith('[$or]') ||
    key.endsWith('[$nor]')

  if (Array.isArray(value)) {
    // `$and`/`$or`/`$nor` values are arrays of objects. When nested,
    // the key can look like `$and[0][$or]` — detect those too to avoid
    // serializing objects as `"[object Object]"`.
    if (isLogicalOperatorArrayKey) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          serializeCRMQueryObject(params, `${key}[${index}]`, item as Record<string, unknown>)
        } else {
          params.append(`${key}[]`, serializePrimitive(item))
        }
      })
      return
    }

    for (const item of value) {
      params.append(`${key}[]`, serializePrimitive(item))
    }
    return
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>

    if ('$in' in obj && Array.isArray(obj.$in)) {
      for (const item of obj.$in) {
        params.append(`${key}[]`, serializePrimitive(item))
      }
      for (const [op, opVal] of Object.entries(obj)) {
        if (op !== '$in') serializeCRMValue(params, `${key}[${op}]`, opVal)
      }
      return
    }

    const hasOperator = Object.keys(obj).some((op) => op.startsWith('$'))
    if (hasOperator) {
      for (const [op, opVal] of Object.entries(obj)) {
        serializeCRMValue(params, `${key}[${op}]`, opVal)
      }
      return
    }

    for (const [childKey, childVal] of Object.entries(obj)) {
      serializeCRMValue(params, `${key}[${childKey}]`, childVal)
    }
    return
  }

  params.append(key, serializePrimitive(value))
}

export const serializeCRMQueryObject = (
  params: URLSearchParams,
  prefix: string,
  query: Record<string, unknown>,
): void => {
  for (const [key, value] of Object.entries(query)) {
    if (!prefix && GET_UNSUPPORTED_TOP_LEVEL_KEYS.has(key)) continue

    const fullKey = prefix ? `${prefix}[${key}]` : key

    if (key === '$and' || key === '$or' || key === '$nor') {
      serializeCRMValue(params, fullKey, value)
      continue
    }

    serializeCRMValue(params, fullKey, value)
  }
}

const formatSortDirection = (value: unknown): 'ASC' | 'DESC' => {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase()
    if (upper === 'ASC' || upper === 'DESC') return upper
  }

  if (value === true || value === -1 || value === '-1') return 'DESC'
  if (value === false || value === 1 || value === '1' || value === 0 || value === '0') return 'ASC'

  const numeric = Number(value)
  if (Number.isFinite(numeric)) return numeric < 0 ? 'DESC' : 'ASC'

  return 'DESC'
}

/** `{ current_price: -1 }` → `['current_price,DESC']` for GET `orderby[]` params. */
export const formatCRMOrderbyEntries = (sort: Record<string, unknown>): string[] =>
  Object.entries(sort).map(([field, direction]) => `${field},${formatSortDirection(direction)}`)

/** @deprecated Prefer formatCRMOrderbyEntries — GET API uses orderby[] with ASC/DESC. */
export const formatCRMOrderby = (sort: Record<string, unknown>): string =>
  formatCRMOrderbyEntries(sort).join(';')

export const crmListingBodyToSearchParams = (body: Record<string, unknown>): URLSearchParams => {
  const params = new URLSearchParams()
  const options =
    body.options && typeof body.options === 'object'
      ? (body.options as Record<string, unknown>)
      : {}
  const query =
    body.query && typeof body.query === 'object' ? (body.query as Record<string, unknown>) : {}

  params.set('page', String(options.page ?? 1))
  params.set('page_size', String(options.limit ?? options.page_size ?? 12))

  const sortFromOptions =
    options.sort && typeof options.sort === 'object'
      ? (options.sort as Record<string, unknown>)
      : undefined
  const sortFromBody =
    body.sort && typeof body.sort === 'object' ? (body.sort as Record<string, unknown>) : undefined
  const sort = sortFromOptions ?? sortFromBody
  const orderbyEntries =
    sort && Object.keys(sort).length > 0
      ? formatCRMOrderbyEntries(sort)
      : ['created_at,DESC']

  for (const entry of orderbyEntries) {
    params.append('orderby[]', entry)
  }

  serializeCRMQueryObject(params, '', query)

  return params
}
