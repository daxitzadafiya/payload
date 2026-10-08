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
    // Column already exists
  }
}

/**
 * ContactSectionBlock: layoutStyle + formPhone for inquiry banner (Buying Guide).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of [
    'pages_blocks_contact_section_block',
    '_pages_v_blocks_contact_section_block',
  ] as const) {
    await addColumnIfMissing(db, table, 'layout_style', "text DEFAULT 'editorial'")
  }

  for (const table of [
    'pages_blocks_contact_section_block_locales',
    '_pages_v_blocks_contact_section_block_locales',
  ] as const) {
    await addColumnIfMissing(db, table, 'form_phone', 'text')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite cannot DROP COLUMN reliably across versions — leave columns in place.
  void db
}
