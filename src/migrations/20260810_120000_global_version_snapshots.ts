import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Ensure global-version-snapshots exists when the prior trash migration
 * already ran without this table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS \`global_version_snapshots\` (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`global_slug\` text NOT NULL,
        \`label\` text NOT NULL,
        \`snapshot\` text NOT NULL,
        \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
        \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
      );
    `)
  } catch {
    // exists
  }

  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`global_version_snapshots_global_slug_idx\` ON \`global_version_snapshots\` (\`global_slug\`);`,
    )
  } catch {
    // exists
  }

  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`global_version_snapshots_updated_at_idx\` ON \`global_version_snapshots\` (\`updated_at\`);`,
    )
  } catch {
    // exists
  }

  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`global_version_snapshots_created_at_idx\` ON \`global_version_snapshots\` (\`created_at\`);`,
    )
  } catch {
    // exists
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keep snapshots table.
}
