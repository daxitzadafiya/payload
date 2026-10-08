import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition}`))
  } catch {
    // Column already exists when dev schema was pushed ahead of migrations.
  }
}

async function dropColumnIfExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column missing or SQLite version does not support DROP COLUMN.
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'deepl_settings', 'source_language', `text DEFAULT 'en'`)
  await addColumnIfMissing(
    db,
    '_deepl_settings_v',
    'version_source_language',
    `text DEFAULT 'en'`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropColumnIfExists(db, 'deepl_settings', 'source_language')
  await dropColumnIfExists(db, '_deepl_settings_v', 'version_source_language')
}
