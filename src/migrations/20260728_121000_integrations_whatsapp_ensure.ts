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
 * Ensure WhatsApp columns exist even if an earlier migration was recorded
 * but the columns were lost (e.g. after db:repair from an older backup).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'integrations_settings', 'whatsapp_enabled', 'integer DEFAULT 0')
  await addColumnIfMissing(db, 'integrations_settings', 'whatsapp_phone_number', 'text')
  await addColumnIfMissing(
    db,
    'integrations_settings',
    'whatsapp_position',
    "text DEFAULT 'right'",
  )
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // no-op — keep columns
}
