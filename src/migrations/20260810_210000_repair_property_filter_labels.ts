import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Backfill missing English labels on property-filter options.
 * Soft-delete/restore without locale:'all' left some rows with es/fr/nl only.
 */
const LOCALIZED_OPTION_TABLES = [
  'property_filters_sort_options',
  'property_filters_price_ranges',
  'property_filters_bedrooms',
  'property_filters_bathrooms',
  'property_filters_features',
  'property_filters_guests',
  'property_filters_holiday_budget_ranges',
  'property_filters_min_prices',
  'property_filters_max_prices',
] as const

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of LOCALIZED_OPTION_TABLES) {
    const localeTable = `${table}_locales`

    const parents = await db.all<{ id: string; value: string | null }>(
      sql.raw(`SELECT \`id\`, \`value\` FROM \`${table}\``),
    )

    for (const parent of parents) {
      const localeRows = await db.all<{ _locale: string; label: string | null }>(
        sql.raw(
          `SELECT \`_locale\`, \`label\` FROM \`${localeTable}\` WHERE \`_parent_id\` = '${escapeSql(parent.id)}'`,
        ),
      )

      const byLocale = new Map(
        localeRows.map((row) => [row._locale, (row.label || '').trim()] as const),
      )

      if (byLocale.get('en')) continue

      const fallback =
        [...byLocale.values()].find((label) => Boolean(label)) ||
        (parent.value || '').trim() ||
        'Option'

      await db.run(
        sql.raw(
          `INSERT INTO \`${localeTable}\` (\`_parent_id\`, \`_locale\`, \`label\`) VALUES ('${escapeSql(parent.id)}', 'en', '${escapeSql(fallback)}')`,
        ),
      )
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Data repair — no rollback.
}
