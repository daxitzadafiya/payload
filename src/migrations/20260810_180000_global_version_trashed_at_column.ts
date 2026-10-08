import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Align global version tables with trashedAt rename on main global tables.
 * Collection version tables (_pages_v, _posts_v) keep version_deleted_at.
 *
 * Also creates missing parent `_*_v` tables when 150000 only created child tables
 * (SQLite often allows that with foreign_keys off).
 */
const GLOBAL_VERSION_TABLES = [
  '_header_v',
  '_footer_v',
  '_theme_v',
  '_localization_v',
  '_logo_v',
  '_cookie_consent_v',
  '_property_map_v',
  '_property_filters_v',
  '_email_settings_v',
  '_optima_crm_v',
  '_deepl_settings_v',
  '_integrations_settings_v',
  '_weather_settings_v',
] as const

/** Minimal parent schemas so Versions works when earlier migrations omitted them. */
const ENSURE_PARENT_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS \`_header_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_favorites_link_type\` text DEFAULT 'reference',
    \`version_favorites_link_new_tab\` integer,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_footer_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_brand_show_on_site\` integer DEFAULT true,
    \`version_brand_display_order\` numeric DEFAULT 1,
    \`version_brand_column_width\` text DEFAULT '3',
    \`version_quick_links_show_on_site\` integer DEFAULT true,
    \`version_quick_links_display_order\` numeric DEFAULT 2,
    \`version_quick_links_column_width\` text DEFAULT '3',
    \`version_contact_show_on_site\` integer DEFAULT true,
    \`version_contact_display_order\` numeric DEFAULT 3,
    \`version_contact_column_width\` text DEFAULT '3',
    \`version_contact_phone\` text,
    \`version_contact_email\` text,
    \`version_certifications_show_on_site\` integer DEFAULT true,
    \`version_certifications_display_order\` numeric DEFAULT 4,
    \`version_certifications_column_width\` text DEFAULT '3',
    \`version_certifications_link_type\` text DEFAULT 'reference',
    \`version_certifications_link_new_tab\` integer,
    \`version_bottom_bar_show_on_site\` integer DEFAULT true,
    \`version_powered_by_url\` text,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_localization_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_default_locale\` text DEFAULT 'en' NOT NULL,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_logo_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_app_name\` text,
    \`version_alt\` text,
    \`version_light_logo_id\` integer,
    \`version_dark_logo_id\` integer,
    \`version_favicon_id\` integer,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_cookie_consent_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_enabled\` integer DEFAULT true,
    \`version_show_close_button\` integer DEFAULT true,
    \`version_policy_link_type\` text DEFAULT 'reference',
    \`version_policy_link_new_tab\` integer,
    \`version_storage_key\` text,
    \`version_expiry_days\` numeric DEFAULT 365,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_property_map_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_default_center_lat\` numeric,
    \`version_default_center_lng\` numeric,
    \`version_default_zoom\` numeric,
    \`version_min_zoom\` numeric,
    \`version_max_zoom\` numeric,
    \`version_enable_draw_search\` integer DEFAULT true,
    \`version_cluster_colors_small\` text,
    \`version_cluster_colors_medium\` text,
    \`version_cluster_colors_large\` text,
    \`version_map_fetch_limit\` numeric,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_property_filters_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_email_settings_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_enabled\` integer DEFAULT false,
    \`version_smtp_host\` text,
    \`version_smtp_port\` numeric DEFAULT 587,
    \`version_smtp_secure\` integer DEFAULT false,
    \`version_smtp_user\` text,
    \`version_smtp_password\` text,
    \`version_sender_from_address\` text,
    \`version_sender_from_name\` text,
    \`version_notifications_recipient_address\` text,
    \`version_client_confirmation_enabled\` integer DEFAULT true,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_optima_crm_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_api_api_url\` text,
    \`version_api_api_key\` text,
    \`version_api_contact_url\` text,
    \`version_api_user_key\` text,
    \`version_api_brochure_template_id\` numeric DEFAULT 39,
    \`version_images_image_url_without_resize\` text,
    \`version_images_image_url\` text,
    \`version_images_commercial_image_base\` text,
    \`version_images_constructions_image_base\` text,
    \`version_images_agency_id\` text,
    \`version_images_property_resize_base\` text,
    \`version_images_site_id\` text,
    \`version_properties_similar_commercials\` text DEFAULT 'exclude_similar',
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_deepl_settings_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_enabled\` integer DEFAULT false,
    \`version_api_url\` text DEFAULT 'https://api.deepl.com',
    \`version_api_key\` text,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_integrations_settings_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_google_maps_api_key\` text,
    \`version_recaptcha_site_key\` text,
    \`version_recaptcha_secret_key\` text,
    \`version_whatsapp_enabled\` integer DEFAULT false,
    \`version_whatsapp_phone_number\` text,
    \`version_whatsapp_position\` text DEFAULT 'right',
    \`version_virtual_assistant_enabled\` integer DEFAULT false,
    \`version_virtual_assistant_embed_script\` text,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_theme_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_font_mode\` text DEFAULT 'site-default',
    \`version_custom_c_s_s\` text,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS \`_weather_settings_v\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`version_enabled\` integer DEFAULT true,
    \`version_base_url\` text,
    \`version_api_key\` text,
    \`version_location\` text,
    \`version_cache_interval_minutes\` numeric DEFAULT 5,
    \`version_trashed_at\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  )`,
]

async function tableExists(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql.raw(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.replace(/'/g, "''")}'`,
    ),
  )
  return rows.length > 0
}

async function tableHasColumn(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  if (!(await tableExists(db, table))) return false
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of ENSURE_PARENT_TABLES) {
    await db.run(sql.raw(statement))
  }

  for (const table of GLOBAL_VERSION_TABLES) {
    if (!(await tableExists(db, table))) continue

    const hasTrashedAt = await tableHasColumn(db, table, 'version_trashed_at')
    if (hasTrashedAt) {
      await db.run(
        sql.raw(
          `CREATE INDEX IF NOT EXISTS \`${table}_version_version_trashed_at_idx\` ON \`${table}\` (\`version_trashed_at\`)`,
        ),
      )
      continue
    }

    const hasDeletedAt = await tableHasColumn(db, table, 'version_deleted_at')
    if (hasDeletedAt) {
      await db.run(
        sql.raw(
          `ALTER TABLE \`${table}\` RENAME COLUMN \`version_deleted_at\` TO \`version_trashed_at\``,
        ),
      )
    } else {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`version_trashed_at\` text`))
    }

    try {
      await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_version_version_deleted_at_idx\``))
    } catch {
      // ignore
    }

    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_version_version_trashed_at_idx\` ON \`${table}\` (\`version_trashed_at\`)`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of GLOBAL_VERSION_TABLES) {
    if (!(await tableExists(db, table))) continue

    const hasDeletedAt = await tableHasColumn(db, table, 'version_deleted_at')
    if (hasDeletedAt) continue

    const hasTrashedAt = await tableHasColumn(db, table, 'version_trashed_at')
    if (!hasTrashedAt) continue

    await db.run(
      sql.raw(
        `ALTER TABLE \`${table}\` RENAME COLUMN \`version_trashed_at\` TO \`version_deleted_at\``,
      ),
    )

    try {
      await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_version_version_trashed_at_idx\``))
    } catch {
      // ignore
    }

    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_version_version_deleted_at_idx\` ON \`${table}\` (\`version_deleted_at\`)`,
      ),
    )
  }
}
