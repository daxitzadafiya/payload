/**
 * Repairs a stuck Payload localization schema push on SQLite.
 *
 * - Removes orphaned __new__* tables from failed Drizzle rebuilds
 * - Adds snapshot + published_locale to version tables so data copy can succeed
 * - Optionally resets DB with --fresh (local dev only)
 *
 * Usage (stop dev server first):
 *   node scripts/fix-localization-schema.mjs
 *   npm run dev
 */
import { createClient } from '../node_modules/.pnpm/@libsql+client@0.14.0/node_modules/@libsql/client/lib-esm/node.js'
import { copyFileSync, existsSync, unlinkSync } from 'node:fs'

const fresh = process.argv.includes('--fresh')
const dbPath = 'roumpos.db'

if (fresh) {
  if (existsSync(dbPath)) {
    copyFileSync(dbPath, `${dbPath}.bak-${Date.now()}`)
    unlinkSync(dbPath)
    console.log(`Removed ${dbPath} (backup created). Run: npm run dev`)
  } else {
    console.log(`No ${dbPath} found. Run: npm run dev`)
  }
  process.exit(0)
}

const client = createClient({ url: `file:${dbPath}` })

async function columnExists(table, column) {
  const { rows } = await client.execute(`PRAGMA table_info(${table})`)
  return rows.some((r) => String(r.name) === column)
}

async function addColumn(table, column, type) {
  if (await columnExists(table, column)) {
    console.log(`skip ${table}.${column} (exists)`)
    return
  }
  await client.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}`)
  console.log(`added ${table}.${column}`)
}

// 1. Drop orphaned Drizzle rebuild tables
const { rows: newTables } = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '__new__%'`,
)
for (const row of newTables) {
  const name = String(row.name)
  await client.execute(`DROP TABLE IF EXISTS \`${name}\``)
  console.log(`dropped orphan table: ${name}`)
}
if (newTables.length === 0) {
  console.log('no __new__* tables found')
}

// 2. Add version columns required for localization migration (match Payload schema)
for (const table of ['_pages_v', '_posts_v']) {
  try {
    await addColumn(table, 'snapshot', 'INTEGER')
    await addColumn(table, 'published_locale', 'TEXT')
  } catch (err) {
    console.error(`${table}: ${err.message}`)
  }
}

// 3. Drop all user indexes so push can recreate without "already exists"
// (include sql IS NULL — partial pushes can leave indexes Drizzle still tries to CREATE)
const { rows: indexes } = await client.execute(
  `SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'`,
)
for (const row of indexes) {
  const name = String(row.name).replace(/"/g, '""')
  await client.execute(`DROP INDEX "${name}"`)
}
if (indexes.length > 0) {
  console.log(`dropped ${indexes.length} indexes`)
}

console.log('\nRepair done.')
console.log('Run schema push in ONE process (avoids Next.js race):')
console.log('  pnpm exec tsx scripts/push-schema-once.mjs')
console.log('Then: npm run dev')
console.log('\nIf it still fails, reset the DB:')
console.log('  node scripts/fix-localization-schema.mjs --fresh')
console.log('  pnpm exec tsx scripts/push-schema-once.mjs')
