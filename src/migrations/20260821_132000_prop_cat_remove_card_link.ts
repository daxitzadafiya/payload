import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function dropColumnIfExists(
  db: MigrateDownArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column missing or SQLite does not support DROP COLUMN.
  }
}

/** Remove unused Page Link (cardLink) columns from Property Category cards. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ['pc_cards', '_pc_cards_v'] as const) {
    await dropColumnIfExists(db, table, 'card_link_type')
    await dropColumnIfExists(db, table, 'card_link_new_tab')
  }

  for (const table of ['pc_cards_locales', '_pc_cards_v_locales'] as const) {
    await dropColumnIfExists(db, table, 'card_link_url')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Re-adding dropped columns is best-effort for rollback.
  for (const table of ['pc_cards', '_pc_cards_v'] as const) {
    try {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`card_link_type\` text DEFAULT 'reference'`))
    } catch {
      // already present
    }
    try {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`card_link_new_tab\` integer`))
    } catch {
      // already present
    }
  }

  for (const table of ['pc_cards_locales', '_pc_cards_v_locales'] as const) {
    try {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`card_link_url\` text`))
    } catch {
      // already present
    }
  }
}
