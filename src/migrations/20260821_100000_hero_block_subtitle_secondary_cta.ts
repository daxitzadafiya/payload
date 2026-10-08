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
    // Column already exists when schema was pushed ahead of migrations.
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
    // Column missing or SQLite version does not support DROP COLUMN.
  }
}

/**
 * HeroBlock: subtitle, secondary CTA, locationText, tagline.
 * Localized string columns live on *_locales; link type/newTab on the block table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ['pages_blocks_hero_block', '_pages_v_blocks_hero_block'] as const) {
    await addColumnIfMissing(db, table, 'secondary_cta_link_type', 'text')
    await addColumnIfMissing(db, table, 'secondary_cta_link_new_tab', 'integer')
  }

  for (const table of [
    'pages_blocks_hero_block_locales',
    '_pages_v_blocks_hero_block_locales',
  ] as const) {
    await addColumnIfMissing(db, table, 'subtitle', 'text')
    await addColumnIfMissing(db, table, 'secondary_button_text', 'text')
    await addColumnIfMissing(db, table, 'secondary_cta_link_url', 'text')
    await addColumnIfMissing(db, table, 'location_text', 'text')
    await addColumnIfMissing(db, table, 'tagline', 'text')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [
    'pages_blocks_hero_block_locales',
    '_pages_v_blocks_hero_block_locales',
  ] as const) {
    await dropColumnIfExists(db, table, 'tagline')
    await dropColumnIfExists(db, table, 'location_text')
    await dropColumnIfExists(db, table, 'secondary_cta_link_url')
    await dropColumnIfExists(db, table, 'secondary_button_text')
    await dropColumnIfExists(db, table, 'subtitle')
  }

  for (const table of ['pages_blocks_hero_block', '_pages_v_blocks_hero_block'] as const) {
    await dropColumnIfExists(db, table, 'secondary_cta_link_new_tab')
    await dropColumnIfExists(db, table, 'secondary_cta_link_type')
  }
}
