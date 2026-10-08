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
 * Footer certifications section link (internal page or custom URL).
 * type/newTab live on footer; url is localized on footer_locales; page refs use footer_rels.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'footer', 'certifications_link_type', "text DEFAULT 'reference'")
  await addColumnIfMissing(db, 'footer', 'certifications_link_new_tab', 'integer')
  await addColumnIfMissing(db, 'footer_locales', 'certifications_link_url', 'text')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [table, column] of [
    ['footer', 'certifications_link_type'],
    ['footer', 'certifications_link_new_tab'],
    ['footer_locales', 'certifications_link_url'],
  ] as const) {
    try {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
    } catch {
      // ignore
    }
  }
}
