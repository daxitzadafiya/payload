/**
 * Delete Translations keys that duplicate Payload CMS localized content
 * (Property Filters option labels, Property List favorites empty states / resultsLabel)
 * or that are dead / unused in code.
 *
 * Usage:
 *   node scripts/delete-cms-dual-and-dead-translation-keys.mjs
 *
 * Uses DATABASE_URL from .env (same as Payload), default file:./roumpos.db
 * Safe to re-run.
 *
 * Keeps field chrome keys (propertyList.filters.bedrooms, .sortBy, .features.emptyLabel, …)
 * and empty states that have no CMS field (noProjectFavorites*, noProperties*, noProjects*).
 */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { createClient } = require('@libsql/client')

function loadDatabaseUrl() {
  const envPath = resolve(process.cwd(), '.env')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (key === 'DATABASE_URL' && value) return value
    }
  }
  return process.env.DATABASE_URL || 'file:./roumpos.db'
}

const EXACT_KEYS_TO_DELETE = [
  // Dead / unused
  'propertyList.filters.searchProperties',
  'propertyList.filters.location',
  'propertyList.filters.location.emptyLabel',
  'propertyList.filters.location.placeholder',
  'propertyList.filters.state',
  'propertyList.filters.state.emptyLabel',
  'propertyList.filters.status',
  'propertyList.filters.status.emptyLabel',
  'propertyList.filters.status.project',
  'propertyList.filters.status.resale',
  'propertyList.filters.country.emptyLabel',
  'propertyList.filters.features.golf',
  'propertyList.filters.features.mountain',
  'propertyList.filters.features.sea views',
  // Property List block CMS (localized + DeepL)
  'propertyList.emptyState.noFavoritesTitle',
  'propertyList.emptyState.noFavoritesDescription',
  'propertyList.emptyState.noMatchingFavoritesTitle',
  'propertyList.emptyState.noMatchingFavoritesDescription',
  'propertyList.results.extraordinaryProperties',
]

const PREFIXES_TO_DELETE = [
  'propertyList.sort.',
  'propertyList.filters.bedrooms.',
  'propertyList.filters.bathrooms.',
  'propertyList.filters.minPrice.',
  'propertyList.filters.maxPrice.',
  'propertyList.filters.priceRange.',
  'propertyList.filters.guests.',
  'propertyList.filters.totalBudget.',
  'propertyList.filters.deliveryDate.',
  'propertyList.filters.distanceToSea.',
]

async function main() {
  const url = loadDatabaseUrl()
  const resolvedUrl =
    url.startsWith('file:') && !url.startsWith('file:/')
      ? `file:${resolve(process.cwd(), url.slice('file:'.length))}`
      : url

  console.log(`Using DB: ${resolvedUrl}`)
  const client = createClient({ url: resolvedUrl })

  const likeClauses = PREFIXES_TO_DELETE.map(() => '`key` LIKE ?').join(' OR ')
  const exactPlaceholders = EXACT_KEYS_TO_DELETE.map(() => '?').join(', ')
  const args = [...EXACT_KEYS_TO_DELETE, ...PREFIXES_TO_DELETE.map((p) => `${p}%`)]

  const preview = await client.execute({
    sql: `SELECT id, key FROM translations WHERE key IN (${exactPlaceholders}) OR (${likeClauses}) ORDER BY key`,
    args,
  })

  console.log(`Matched ${preview.rows.length} translation key(s):`)
  for (const row of preview.rows) {
    console.log(`  - ${row.key}`)
  }

  if (preview.rows.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  const ids = preview.rows.map((r) => r.id)
  const idPlaceholders = ids.map(() => '?').join(', ')

  const locked = await client.execute({
    sql: `DELETE FROM payload_locked_documents_rels WHERE translations_id IN (${idPlaceholders})`,
    args: ids,
  })
  console.log(`Cleared ${locked.rowsAffected ?? 0} locked-document rel row(s)`)

  const deleted = await client.execute({
    sql: `DELETE FROM translations WHERE id IN (${idPlaceholders})`,
    args: ids,
  })
  console.log(`Deleted ${deleted.rowsAffected ?? 0} translation row(s)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
