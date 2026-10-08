/**
 * Repairs a corrupted local SQLite database (SQLITE_CORRUPT / broken indexes).
 *
 * Stop the dev server before running:
 *   npm run db:repair
 *   npx payload migrate
 *   npm run dev
 */
import { copyFileSync, existsSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const dbPath = 'roumpos.db'

function removeSidecars(path) {
  for (const sidecar of [`${path}-wal`, `${path}-shm`]) {
    if (existsSync(sidecar)) unlinkSync(sidecar)
  }
}

function integrityCheck(path) {
  try {
    const db = new Database(path, { readonly: true, fileMustExist: true })
    const result = db.pragma('integrity_check')
    db.close()
    const value = Array.isArray(result) ? result[0] : result
    const status = typeof value === 'object' && value ? value.integrity_check : value
    return status === 'ok' ? 'ok' : String(status ?? 'failed')
  } catch (error) {
    return error instanceof Error ? error.message : 'failed'
  }
}

function reindexDatabase(path) {
  try {
    const db = new Database(path)
    db.exec('REINDEX')
    db.close()
  } catch (error) {
    console.error('REINDEX failed:', error instanceof Error ? error.message : error)
  }
}

function listBackupCandidates() {
  const candidates = []

  if (existsSync('backup')) {
    for (const name of readdirSync('backup')) {
      if (!name.endsWith('.db')) continue
      candidates.push(`backup/${name}`)
    }
  }

  for (const name of readdirSync('.')) {
    if (name === dbPath) continue
    if (name.startsWith(`${dbPath}.bak-`)) {
      candidates.push(name)
    }
  }

  return candidates
    .filter((path) => existsSync(path))
    .map((path) => ({ path, mtimeMs: statSync(path).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}

function normalizeDatabase(path) {
  const db = new Database(path)
  db.pragma('journal_mode = DELETE')
  db.pragma('synchronous = FULL')
  db.exec('VACUUM')
  db.close()
  removeSidecars(path)
}

function restoreFromBackup() {
  const candidates = listBackupCandidates()

  for (const { path } of candidates) {
    if (path.includes('.corrupt-')) continue

    const status = integrityCheck(path)
    if (status !== 'ok') continue

    copyFileSync(path, dbPath)
    removeSidecars(dbPath)
    normalizeDatabase(dbPath)
    console.log(`Restored ${dbPath} from ${path}`)
    return true
  }

  return false
}

function runSqliteRecover() {
  const result = spawnSync('sqlite3', [dbPath, '.recover'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  if (result.error || result.status !== 0) return null
  return (result.stdout || '').trim() || null
}

function importRecoveredSql(recoverSql) {
  const recoveredPath = `${dbPath}.recovered`
  if (existsSync(recoveredPath)) unlinkSync(recoveredPath)

  const result = spawnSync('sqlite3', [recoveredPath], {
    input: recoverSql,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  if (result.error || result.status !== 0) {
    if (existsSync(recoveredPath)) unlinkSync(recoveredPath)
    return false
  }

  if (integrityCheck(recoveredPath) !== 'ok') {
    unlinkSync(recoveredPath)
    return false
  }

  renameSync(recoveredPath, dbPath)
  removeSidecars(dbPath)
  return true
}

if (!existsSync(dbPath)) {
  if (restoreFromBackup()) {
    console.log('No active database found; restored from backup.')
    console.log('Run migrations: npx payload migrate')
    process.exit(0)
  }

  console.error(`No ${dbPath} found and no valid backup available.`)
  process.exit(1)
}

removeSidecars(dbPath)

let integrity = integrityCheck(dbPath)
if (integrity === 'ok') {
  normalizeDatabase(dbPath)
  console.log(`${dbPath} integrity check: ok (normalized journal mode)`)
  process.exit(0)
}

console.log(`${dbPath} integrity check failed (${integrity})`)

const backupPath = `${dbPath}.bak-${Date.now()}`
copyFileSync(dbPath, backupPath)
console.log(`Backed up database to ${backupPath}`)

console.log('Attempting REINDEX...')
reindexDatabase(dbPath)

integrity = integrityCheck(dbPath)
if (integrity === 'ok') {
  removeSidecars(dbPath)
  console.log(`${dbPath} repaired with REINDEX.`)
  console.log('Start the app: npm run dev')
  process.exit(0)
}

console.log('REINDEX did not fix the database.')

const corruptBackupPath = `${dbPath}.corrupt-${Date.now()}`
copyFileSync(dbPath, corruptBackupPath)
console.log(`Backed up corrupt database to ${corruptBackupPath}`)

const recoverSql = runSqliteRecover()
if (recoverSql && importRecoveredSql(recoverSql)) {
  normalizeDatabase(dbPath)
  console.log(`Replaced ${dbPath} with sqlite3-recovered copy.`)
  console.log('Run migrations: npx payload migrate')
  console.log('Then start the app: npm run dev')
  process.exit(0)
}

console.log('sqlite3 recovery unavailable or failed — restoring from backup...')

if (!restoreFromBackup()) {
  console.error(
    'No valid backup database found. Install sqlite3 for recovery: sudo apt install sqlite3',
  )
  process.exit(1)
}

console.log('Run migrations: npx payload migrate')
console.log('Then start the app: npm run dev')
