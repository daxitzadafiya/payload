import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Align live Optima CRM settings table with global dbName: 'optima_crm'
 * (shortened for SQLite identifier limits on version tables).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const existing = await db.all<{ name: string }>(
    sql.raw(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('optima_crm_settings', 'optima_crm')`,
    ),
  )
  const names = new Set((existing || []).map((row) => row.name))

  if (names.has('optima_crm')) {
    return
  }

  if (!names.has('optima_crm_settings')) {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS \`optima_crm\` (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`api_api_url\` text,
        \`api_api_key\` text,
        \`api_contact_url\` text,
        \`api_user_key\` text,
        \`api_brochure_template_id\` numeric DEFAULT 39,
        \`images_image_url_without_resize\` text DEFAULT 'https://images.optima-crm.com/cms_medias/',
        \`images_image_url\` text DEFAULT 'https://images.optima-crm.com/resize/cms_medias/',
        \`images_commercial_image_base\` text DEFAULT 'https://images.optima-crm.com/commercial_images',
        \`images_constructions_image_base\` text DEFAULT 'https://images.optima-crm.com/constructions_images',
        \`images_agency_id\` text,
        \`images_property_resize_base\` text DEFAULT 'https://images.optima-crm.com/resize/',
        \`images_site_id\` text DEFAULT '237',
        \`properties_similar_commercials\` text DEFAULT 'exclude_similar',
        \`deleted_at\` text,
        \`updated_at\` text,
        \`created_at\` text
      );
    `)
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`optima_crm_deleted_at_idx\` ON \`optima_crm\` (\`deleted_at\`)`,
    )
    return
  }

  await db.run(sql`ALTER TABLE \`optima_crm_settings\` RENAME TO \`optima_crm\``)

  try {
    await db.run(sql`DROP INDEX IF EXISTS \`optima_crm_settings_deleted_at_idx\``)
  } catch {
    // ignore
  }

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`optima_crm_deleted_at_idx\` ON \`optima_crm\` (\`deleted_at\`)`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const existing = await db.all<{ name: string }>(
    sql.raw(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('optima_crm_settings', 'optima_crm')`,
    ),
  )
  const names = new Set((existing || []).map((row) => row.name))

  if (names.has('optima_crm_settings') || !names.has('optima_crm')) {
    return
  }

  await db.run(sql`ALTER TABLE \`optima_crm\` RENAME TO \`optima_crm_settings\``)

  try {
    await db.run(sql`DROP INDEX IF EXISTS \`optima_crm_deleted_at_idx\``)
  } catch {
    // ignore
  }

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`optima_crm_settings_deleted_at_idx\` ON \`optima_crm_settings\` (\`deleted_at\`)`,
  )
}
