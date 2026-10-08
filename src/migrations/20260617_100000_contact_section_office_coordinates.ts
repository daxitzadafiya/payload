import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

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

const OFFICE_TABLES = [
  'pages_blocks_contact_section_block_offices',
  '_pages_v_blocks_contact_section_block_offices',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of OFFICE_TABLES) {
    await addColumnIfMissing(db, table, 'lat', 'real')
    await addColumnIfMissing(db, table, 'lon', 'real')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite cannot drop columns safely in all environments; leave columns in place.
  void db
}
