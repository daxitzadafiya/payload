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

const MAP_BLOCK_TABLES = ['pages_blocks_map_block', '_pages_v_blocks_map_block'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of MAP_BLOCK_TABLES) {
    await addColumnIfMissing(db, table, 'center_lat', 'real DEFAULT 48.9903224')
    await addColumnIfMissing(db, table, 'center_lng', 'real DEFAULT 12.1991392')
    await addColumnIfMissing(db, table, 'default_zoom', 'real DEFAULT 6')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite cannot drop columns safely in all environments; leave columns in place.
  void db
}
