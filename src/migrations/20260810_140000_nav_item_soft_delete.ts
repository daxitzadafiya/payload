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

const TABLES = [
  'header_nav_items',
  'sub_nav',
  'footer_nav_items',
  'footer_social_links',
  'footer_legal_links',
  'footer_certifications',
] as const

/** Ensure soft-delete columns exist on menu/link array tables. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    await addColumnIfMissing(db, table, 'is_deleted', 'integer DEFAULT 0')
    await addColumnIfMissing(db, table, 'deleted_at', 'text')
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keep soft-delete columns.
}
