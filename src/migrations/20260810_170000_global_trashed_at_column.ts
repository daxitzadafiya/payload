import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Rename globals soft-delete column to trashed_at so Payload does not treat
 * trashed globals as native collection trash (which crashes on id.toString()).
 */
const GLOBAL_TABLES = [
  'header',
  'footer',
  'theme',
  'localization',
  'logo',
  'cookie_consent',
  'property_map',
  'property_filters',
  'email_settings',
  'optima_crm',
  'deepl_settings',
  'integrations_settings',
  'weather_settings',
] as const

async function tableHasColumn(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of GLOBAL_TABLES) {
    const exists = await db.all<{ name: string }>(
      sql.raw(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.replace(/'/g, "''")}'`,
      ),
    )
    if (!exists.length) continue

    const hasTrashedAt = await tableHasColumn(db, table, 'trashed_at')
    if (hasTrashedAt) continue

    const hasDeletedAt = await tableHasColumn(db, table, 'deleted_at')
    if (hasDeletedAt) {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` RENAME COLUMN \`deleted_at\` TO \`trashed_at\``))
    } else {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`trashed_at\` text`))
    }

    try {
      await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_deleted_at_idx\``))
    } catch {
      // ignore
    }

    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_trashed_at_idx\` ON \`${table}\` (\`trashed_at\`)`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of GLOBAL_TABLES) {
    const hasDeletedAt = await tableHasColumn(db, table, 'deleted_at')
    if (hasDeletedAt) continue

    const hasTrashedAt = await tableHasColumn(db, table, 'trashed_at')
    if (!hasTrashedAt) continue

    await db.run(sql.raw(`ALTER TABLE \`${table}\` RENAME COLUMN \`trashed_at\` TO \`deleted_at\``))

    try {
      await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_trashed_at_idx\``))
    } catch {
      // ignore
    }

    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_deleted_at_idx\` ON \`${table}\` (\`deleted_at\`)`,
      ),
    )
  }
}
