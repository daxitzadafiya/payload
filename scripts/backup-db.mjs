/**
 * Backup SQLite database before deploy.
 *
 *   npm run backup:db
 *   npm run backup:db -- /custom/path/website.db
 */
import 'dotenv/config'

import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const rawDbUrl = process.argv[2] || process.env.DATABASE_URL || 'file:./roumpos.db'
const dbPath = rawDbUrl.startsWith('file:')
  ? resolve(process.cwd(), rawDbUrl.replace(/^file:/, ''))
  : resolve(process.cwd(), rawDbUrl)

if (!existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`)
  process.exit(1)
}

const backupDir = resolve(process.cwd(), 'backup')
mkdirSync(backupDir, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const baseName = dbPath.split('/').pop() || 'database.db'
const backupPath = resolve(backupDir, `${baseName}.pre-deploy-${stamp}`)

copyFileSync(dbPath, backupPath)
console.log(`Backed up ${dbPath}`)
console.log(`         -> ${backupPath}`)
