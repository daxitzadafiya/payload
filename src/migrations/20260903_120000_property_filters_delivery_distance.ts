import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Re-enable Property Filters deliveryDates + distanceToSea in admin versions.
 * Live tables already exist; version tables were never created when those fields
 * were removed from the global config.
 * Also normalizes blank “any” values and backfills missing locale labels.
 */

const LOCALES = ['en', 'de', 'el', 'fr', 'es', 'it', 'nl'] as const

const OPTION_TABLES = [
  'property_filters_delivery_dates',
  'property_filters_distance_to_sea',
] as const

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

async function createVersionOptionTables(db: MigrateUpArgs['db']): Promise<void> {
  for (const suffix of ['delivery_dates', 'distance_to_sea'] as const) {
    const table = `_property_filters_v_version_${suffix}`
    const locales = `${table}_locales`

    await db.run(sql.raw(`
CREATE TABLE IF NOT EXISTS \`${table}\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`value\` text NOT NULL,
	\`_uuid\` text,
	\`is_deleted\` integer DEFAULT 0,
	\`deleted_at\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_property_filters_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`))
    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_order_idx\` ON \`${table}\` (\`_order\`);`,
      ),
    )
    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_parent_id_idx\` ON \`${table}\` (\`_parent_id\`);`,
      ),
    )
    await db.run(sql.raw(`
CREATE TABLE IF NOT EXISTS \`${locales}\` (
	\`label\` text NOT NULL,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`_locale\` text NOT NULL,
	\`_parent_id\` integer NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`${table}\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`))
  }
}

async function normalizeAnyValues(db: MigrateUpArgs['db']): Promise<void> {
  for (const table of OPTION_TABLES) {
    await db.run(
      sql.raw(
        `UPDATE \`${table}\` SET \`value\` = 'any' WHERE TRIM(COALESCE(\`value\`, '')) = '' OR TRIM(\`value\`) = 'any';`,
      ),
    )
  }
}

async function backfillLocaleLabels(db: MigrateUpArgs['db']): Promise<void> {
  for (const table of OPTION_TABLES) {
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

      const enLabel =
        localeRows.find((row) => row._locale === 'en' && (row.label || '').trim())?.label?.trim() ||
        (parent.value || '').trim() ||
        'Option'
      const byLocale = new Map(
        localeRows.map((row) => [row._locale, (row.label || '').trim()] as const),
      )

      for (const locale of LOCALES) {
        const existing = byLocale.get(locale)
        if (existing) continue
        await db.run(
          sql.raw(
            `INSERT INTO \`${localeTable}\` (\`_parent_id\`, \`_locale\`, \`label\`) VALUES ('${escapeSql(parent.id)}', '${locale}', '${escapeSql(enLabel)}')`,
          ),
        )
      }
    }
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await createVersionOptionTables(db)
  await normalizeAnyValues(db)
  await backfillLocaleLabels(db)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_property_filters_v_version_distance_to_sea_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_property_filters_v_version_distance_to_sea\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_property_filters_v_version_delivery_dates_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_property_filters_v_version_delivery_dates\`;`)
}
