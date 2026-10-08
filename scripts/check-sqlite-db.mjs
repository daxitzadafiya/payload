/**
 * Fails fast when the local SQLite database is corrupt.
 * Used by `npm run dev` via predev.
 */
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const dbPath = 'roumpos.db'

if (!existsSync(dbPath)) {
  console.error(`No ${dbPath} found. Restore with: npm run db:repair`)
  process.exit(1)
}

for (const sidecar of [`${dbPath}-wal`, `${dbPath}-shm`]) {
  if (existsSync(sidecar)) {
    console.warn(
      `Warning: found stale ${sidecar}. Stop the dev server, then run: npm run db:repair`,
    )
  }
}

try {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true })
  const result = db.pragma('integrity_check')
  db.close()

  const value = Array.isArray(result) ? result[0] : result
  const status = typeof value === 'object' && value ? value.integrity_check : value

  if (status !== 'ok') {
    console.error(`${dbPath} failed integrity check: ${status}`)
    console.error('Stop the dev server, then run: npm run db:repair')
    process.exit(1)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`${dbPath} is unreadable: ${message}`)
  console.error('Stop the dev server, then run: npm run db:repair')
  process.exit(1)
}
