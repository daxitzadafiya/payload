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

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(
    db,
    'email_settings_locales',
    'client_confirmation_holiday_booking_subject',
    'text',
  )
  await addColumnIfMissing(
    db,
    'email_settings_locales',
    'client_confirmation_holiday_booking_content',
    'text',
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite cannot drop columns reliably across versions; leave columns in place.
  void db
}
