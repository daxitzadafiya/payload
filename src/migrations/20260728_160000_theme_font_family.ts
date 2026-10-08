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

/**
 * Theme global: site-wide Google font selection (fontFamily → font_family).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'theme', 'font_family', "text DEFAULT 'site-default'")
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`theme\` DROP COLUMN \`font_family\``))
  } catch {
    // ignore
  }
}
