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

async function createIndexIfMissing(db: MigrateUpArgs['db'], statement: string): Promise<void> {
  try {
    await db.run(sql.raw(statement))
  } catch {
    // Already present.
  }
}

const DELETED_AT_TABLES = [
  'pages',
  'posts',
  'media',
  'categories',
  'countries',
  'translations',
  'redirects',
  'forms',
  'form_submissions',
  'header',
  'footer',
  'theme',
  'localization',
  'logo',
  'cookie_consent',
  'property_map',
  'property_filters',
  'email_settings',
  'optima_crm_settings',
  'optima_crm',
  'deepl_settings',
  'integrations_settings',
  'weather_settings',
] as const

const VERSION_DELETED_AT_TABLES = ['_pages_v', '_posts_v'] as const

/**
 * Soft-delete columns for collection trash + globals soft-trash,
 * plus the global-version-snapshots collection for point-in-time restore.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of DELETED_AT_TABLES) {
    await addColumnIfMissing(db, table, 'deleted_at', 'text')
    await createIndexIfMissing(
      db,
      `CREATE INDEX IF NOT EXISTS \`${table}_deleted_at_idx\` ON \`${table}\` (\`deleted_at\`)`,
    )
  }

  for (const table of VERSION_DELETED_AT_TABLES) {
    await addColumnIfMissing(db, table, 'version_deleted_at', 'text')
    await createIndexIfMissing(
      db,
      `CREATE INDEX IF NOT EXISTS \`${table}_version_version_deleted_at_idx\` ON \`${table}\` (\`version_deleted_at\`)`,
    )
  }

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

  await createIndexIfMissing(
    db,
    `CREATE INDEX IF NOT EXISTS \`global_version_snapshots_global_slug_idx\` ON \`global_version_snapshots\` (\`global_slug\`)`,
  )
  await createIndexIfMissing(
    db,
    `CREATE INDEX IF NOT EXISTS \`global_version_snapshots_updated_at_idx\` ON \`global_version_snapshots\` (\`updated_at\`)`,
  )
  await createIndexIfMissing(
    db,
    `CREATE INDEX IF NOT EXISTS \`global_version_snapshots_created_at_idx\` ON \`global_version_snapshots\` (\`created_at\`)`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Keep soft-delete columns; dropping them would destroy trash state.
  void db
}
