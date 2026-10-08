import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Ensure Users + Search Results have deleted_at for native trash
 * (Restore / Permanent Delete / Empty Trash), matching Pages.
 */
const TABLES = ['users', 'search'] as const

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
  } catch {
    // Already present.
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    await addColumnIfMissing(db, table, 'deleted_at', 'text')
    try {
      await db.run(
        sql.raw(`CREATE INDEX IF NOT EXISTS \`${table}_deleted_at_idx\` ON \`${table}\` (\`deleted_at\`)`),
      )
    } catch {
      // Already present.
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keep columns; dropping would destroy trash state.
}
