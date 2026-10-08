/**
 * Scan posts-related SQLite tables for truncated or invalid JSON text fields.
 *
 * Usage:
 *   DATABASE_URL=file:./roumpos.db node scripts/find-bad-json.mjs
 *
 * Exit code 0 = no issues, 1 = invalid JSON found.
 */
import { createClient } from '@libsql/client'

const dbUrl = process.env.DATABASE_URL || 'file:./roumpos.db'
const client = createClient({ url: dbUrl })

function tryParse(val, table, column, id, locale, parentId) {
  if (val == null || val === '') return null
  const s = String(val)
  if (!s.startsWith('{') && !s.startsWith('[')) return null
  try {
    JSON.parse(s)
    return null
  } catch (e) {
    return {
      table,
      column,
      id,
      locale,
      parentId,
      length: s.length,
      error: e.message,
      tail: s.slice(Math.max(0, s.length - 80)),
    }
  }
}

const tables = await client.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%posts%' ORDER BY name`,
)

const bad = []

for (const { name: table } of tables.rows) {
  const cols = await client.execute(`PRAGMA table_info(${table})`)
  const textCols = cols.rows.filter((c) => String(c.type).toLowerCase() === 'text')
  if (textCols.length === 0) continue

  const colNames = textCols.map((c) => c.name)
  const hasId = cols.rows.some((c) => c.name === 'id')
  const parentCol = cols.rows.some((c) => c.name === '_parent_id')
    ? '_parent_id'
    : cols.rows.some((c) => c.name === 'parent_id')
      ? 'parent_id'
      : null
  const hasLocale = cols.rows.some((c) => c.name === '_locale')

  const selectCols = [
    ...(hasId ? ['id'] : []),
    ...(parentCol ? [parentCol] : []),
    ...(hasLocale ? ['_locale'] : []),
    ...colNames,
  ].join(', ')

  const rows = await client.execute(`SELECT ${selectCols} FROM ${table}`)
  for (const row of rows.rows) {
    const id = row.id ?? row[parentCol] ?? '?'
    const locale = row._locale ?? ''
    const parentId = parentCol ? row[parentCol] : null
    for (const col of colNames) {
      const issue = tryParse(row[col], table, col, id, locale, parentId)
      if (issue) bad.push(issue)
    }
  }
}

if (bad.length === 0) {
  console.log('No invalid JSON found in posts-related tables.')
  process.exit(0)
}

console.log(JSON.stringify(bad, null, 2))
console.log(`Found ${bad.length} invalid JSON field(s).`)
process.exit(1)
