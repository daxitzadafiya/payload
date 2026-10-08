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

/** Array tables that store soft-deleted global/settings rows. */
const ARRAY_TABLES = [
  'localization_languages',
  'theme_google_fonts',
  'property_filters_sort_options',
  'property_filters_price_ranges',
  'property_filters_bedrooms',
  'property_filters_bathrooms',
  'property_filters_features',
  'property_filters_guests',
  'property_filters_holiday_budget_ranges',
  'property_filters_min_prices',
  'property_filters_max_prices',
  'property_filters_statuses',
  'property_filters_delivery_dates',
  'property_filters_distance_to_sea',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ARRAY_TABLES) {
    await addColumnIfMissing(db, table, 'is_deleted', 'integer DEFAULT 0')
    await addColumnIfMissing(db, table, 'deleted_at', 'text')
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keep soft-delete columns.
}
