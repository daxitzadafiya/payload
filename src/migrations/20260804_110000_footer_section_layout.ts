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
 * Footer visibility + section layout controls (show on site, display order, column width).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'footer', 'show_on_site', 'integer DEFAULT 1')

  await addColumnIfMissing(db, 'footer', 'brand_show_on_site', 'integer DEFAULT 1')
  await addColumnIfMissing(db, 'footer', 'brand_display_order', 'numeric DEFAULT 1')
  await addColumnIfMissing(db, 'footer', 'brand_column_width', "text DEFAULT '3'")

  await addColumnIfMissing(db, 'footer', 'quick_links_show_on_site', 'integer DEFAULT 1')
  await addColumnIfMissing(db, 'footer', 'quick_links_display_order', 'numeric DEFAULT 2')
  await addColumnIfMissing(db, 'footer', 'quick_links_column_width', "text DEFAULT '3'")

  await addColumnIfMissing(db, 'footer', 'contact_show_on_site', 'integer DEFAULT 1')
  await addColumnIfMissing(db, 'footer', 'contact_display_order', 'numeric DEFAULT 3')
  await addColumnIfMissing(db, 'footer', 'contact_column_width', "text DEFAULT '3'")

  await addColumnIfMissing(db, 'footer', 'certifications_show_on_site', 'integer DEFAULT 1')
  await addColumnIfMissing(db, 'footer', 'certifications_display_order', 'numeric DEFAULT 4')
  await addColumnIfMissing(db, 'footer', 'certifications_column_width', "text DEFAULT '3'")

  await addColumnIfMissing(db, 'footer', 'bottom_bar_show_on_site', 'integer DEFAULT 1')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const column of [
    'show_on_site',
    'brand_show_on_site',
    'brand_display_order',
    'brand_column_width',
    'quick_links_show_on_site',
    'quick_links_display_order',
    'quick_links_column_width',
    'contact_show_on_site',
    'contact_display_order',
    'contact_column_width',
    'certifications_show_on_site',
    'certifications_display_order',
    'certifications_column_width',
    'bottom_bar_show_on_site',
  ] as const) {
    try {
      await db.run(sql.raw(`ALTER TABLE \`footer\` DROP COLUMN \`${column}\``))
    } catch {
      // ignore
    }
  }
}
