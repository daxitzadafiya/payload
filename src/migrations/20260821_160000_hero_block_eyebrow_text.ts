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
 * HeroBlock: localized eyebrowText (gold line above the title).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of [
    'pages_blocks_hero_block_locales',
    '_pages_v_blocks_hero_block_locales',
  ] as const) {
    await addColumnIfMissing(db, table, 'eyebrow_text', 'text')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [
    'pages_blocks_hero_block_locales',
    '_pages_v_blocks_hero_block_locales',
  ] as const) {
    await dropColumnIfExists(db, table, 'eyebrow_text')
  }
}
