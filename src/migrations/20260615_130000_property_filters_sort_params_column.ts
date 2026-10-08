import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition}`))
  } catch {
    // Column already exists when dev schema was pushed ahead of migrations.
  }
}

async function dropColumnIfExists(db: MigrateUpArgs['db'], table: string, column: string): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column missing or SQLite version does not support DROP COLUMN.
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'property_filters_sort_options', 'sort_params', 'text')

  // Remove columns from an earlier dev schema push that used sort_key/sort_direction.
  await dropColumnIfExists(db, 'property_filters_sort_options', 'sort_key')
  await dropColumnIfExists(db, 'property_filters_sort_options', 'sort_direction')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropColumnIfExists(db, 'property_filters_sort_options', 'sort_params')
}
