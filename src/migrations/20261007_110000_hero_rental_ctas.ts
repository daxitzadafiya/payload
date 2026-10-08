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

const BLOCK_TABLES = ['pages_blocks_hero_block', '_pages_v_blocks_hero_block'] as const
const LOCALE_TABLES = [
  'pages_blocks_hero_block_locales',
  '_pages_v_blocks_hero_block_locales',
] as const

/**
 * Hero CTAs for short-term (holiday) and long-term rental listings.
 * Localized labels live on *_locales; link type lives on the block table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of BLOCK_TABLES) {
    await addColumnIfMissing(db, table, 'short_term_cta_link_type', `text DEFAULT 'custom'`)
    await addColumnIfMissing(db, table, 'short_term_cta_link_new_tab', 'integer')
    await addColumnIfMissing(db, table, 'long_term_cta_link_type', `text DEFAULT 'custom'`)
    await addColumnIfMissing(db, table, 'long_term_cta_link_new_tab', 'integer')
  }

  for (const table of LOCALE_TABLES) {
    await addColumnIfMissing(db, table, 'short_term_button_text', 'text')
    await addColumnIfMissing(db, table, 'short_term_cta_link_url', 'text')
    await addColumnIfMissing(db, table, 'long_term_button_text', 'text')
    await addColumnIfMissing(db, table, 'long_term_cta_link_url', 'text')
  }

  for (const table of BLOCK_TABLES) {
    await db.run(
      sql.raw(
        `UPDATE \`${table}\` SET \`short_term_cta_link_type\` = 'custom' WHERE \`short_term_cta_link_type\` IS NULL OR \`short_term_cta_link_type\` = ''`,
      ),
    )
    await db.run(
      sql.raw(
        `UPDATE \`${table}\` SET \`long_term_cta_link_type\` = 'custom' WHERE \`long_term_cta_link_type\` IS NULL OR \`long_term_cta_link_type\` = ''`,
      ),
    )
  }

  for (const table of LOCALE_TABLES) {
    await db.run(
      sql.raw(`
        UPDATE \`${table}\`
        SET
          \`short_term_button_text\` = CASE \`_locale\`
            WHEN 'es' THEN 'Alquiler a corto plazo'
            WHEN 'fr' THEN 'Location courte durée'
            WHEN 'fi' THEN 'Lyhytaikainen vuokraus'
            WHEN 'de' THEN 'Kurzzeitmiete'
            ELSE 'Short-term rentals'
          END,
          \`short_term_cta_link_url\` = '/holiday-rentals'
        WHERE \`short_term_button_text\` IS NULL OR trim(\`short_term_button_text\`) = ''
      `),
    )
    await db.run(
      sql.raw(`
        UPDATE \`${table}\`
        SET
          \`long_term_button_text\` = CASE \`_locale\`
            WHEN 'es' THEN 'Alquiler a largo plazo'
            WHEN 'fr' THEN 'Location longue durée'
            WHEN 'fi' THEN 'Pitkäaikainen vuokraus'
            WHEN 'de' THEN 'Langzeitmiete'
            ELSE 'Long-term rentals'
          END,
          \`long_term_cta_link_url\` = '/property-for-rent'
        WHERE \`long_term_button_text\` IS NULL OR trim(\`long_term_button_text\`) = ''
      `),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of LOCALE_TABLES) {
    await dropColumnIfExists(db, table, 'long_term_cta_link_url')
    await dropColumnIfExists(db, table, 'long_term_button_text')
    await dropColumnIfExists(db, table, 'short_term_cta_link_url')
    await dropColumnIfExists(db, table, 'short_term_button_text')
  }

  for (const table of BLOCK_TABLES) {
    await dropColumnIfExists(db, table, 'long_term_cta_link_new_tab')
    await dropColumnIfExists(db, table, 'long_term_cta_link_type')
    await dropColumnIfExists(db, table, 'short_term_cta_link_new_tab')
    await dropColumnIfExists(db, table, 'short_term_cta_link_type')
  }
}
