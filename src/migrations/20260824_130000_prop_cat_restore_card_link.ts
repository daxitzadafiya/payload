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
    // Column already exists or table is unavailable.
  }
}

async function dropColumnIfExists(
  db: MigrateDownArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column is missing or SQLite does not support DROP COLUMN.
  }
}

/** Restore Property Category card link columns after replacing CRM preset with page links. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ['pc_cards', '_pc_cards_v'] as const) {
    await addColumnIfMissing(db, table, 'card_link_type', "text DEFAULT 'reference'")
    await addColumnIfMissing(db, table, 'card_link_new_tab', 'integer')
  }

  for (const table of ['pc_cards_locales', '_pc_cards_v_locales'] as const) {
    await addColumnIfMissing(db, table, 'card_link_url', 'text')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of ['pc_cards_locales', '_pc_cards_v_locales'] as const) {
    await dropColumnIfExists(db, table, 'card_link_url')
  }

  for (const table of ['pc_cards', '_pc_cards_v'] as const) {
    await dropColumnIfExists(db, table, 'card_link_new_tab')
    await dropColumnIfExists(db, table, 'card_link_type')
  }
}
