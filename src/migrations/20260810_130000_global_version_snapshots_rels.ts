import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

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

/**
 * Polymorphic lock/preference relation columns for global-version-snapshots.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(
    db,
    'payload_locked_documents_rels',
    'global_version_snapshots_id',
    'integer',
  )

  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_global_version_snapshots_id_idx\` ON \`payload_locked_documents_rels\` (\`global_version_snapshots_id\`);`,
    )
  } catch {
    // exists
  }

  await addColumnIfMissing(db, 'payload_preferences_rels', 'global_version_snapshots_id', 'integer')

  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_global_version_snapshots_id_idx\` ON \`payload_preferences_rels\` (\`global_version_snapshots_id\`);`,
    )
  } catch {
    // exists
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keep relation columns.
}
