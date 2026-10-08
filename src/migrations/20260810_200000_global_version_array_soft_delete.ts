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
    // Already present or table missing.
  }
}

/**
 * Soft-delete columns on global version array tables.
 * Main tables already have is_deleted/deleted_at; versions must match or saves fail.
 */
const VERSION_ARRAY_TABLES = [
  '_footer_v_version_social_links',
  '_footer_v_version_certifications',
  '_footer_v_version_legal_links',
  '_localization_v_version_languages',
  '_theme_v_version_google_fonts',
  '_property_filters_v_version_sort_options',
  '_property_filters_v_version_price_ranges',
  '_property_filters_v_version_bedrooms',
  '_property_filters_v_version_bathrooms',
  '_property_filters_v_version_features',
  '_property_filters_v_version_guests',
  '_property_filters_v_version_holiday_budget_ranges',
  '_property_filters_v_version_min_prices',
  '_property_filters_v_version_max_prices',
  '_property_filters_v_version_statuses',
  '_property_filters_v_version_delivery_dates',
  '_property_filters_v_version_distance_to_sea',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of VERSION_ARRAY_TABLES) {
    await addColumnIfMissing(db, table, 'is_deleted', 'integer DEFAULT 0')
    await addColumnIfMissing(db, table, 'deleted_at', 'text')
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keep soft-delete columns on version tables.
}
