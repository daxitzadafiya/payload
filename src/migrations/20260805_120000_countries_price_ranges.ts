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
 * Add country-scoped price / holiday budget range selections
 * (JSON arrays of Property Filters range `value` keys).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'countries', 'sale_price_ranges', 'text')
  await addColumnIfMissing(db, 'countries', 'rental_price_ranges', 'text')
  await addColumnIfMissing(db, 'countries', 'holiday_budget_ranges', 'text')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`countries\` DROP COLUMN \`sale_price_ranges\`;`)
  await db.run(sql`ALTER TABLE \`countries\` DROP COLUMN \`rental_price_ranges\`;`)
  await db.run(sql`ALTER TABLE \`countries\` DROP COLUMN \`holiday_budget_ranges\`;`)
}
