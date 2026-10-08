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
    // Column already exists when schema was pushed or migration re-run.
  }
}

/**
 * Add WhatsApp floating-button settings to Integrations global.
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

export async function down({ db }: MigrateDownArgs): Promise<void> {
  try {
    await db.run(sql`ALTER TABLE \`integrations_settings\` DROP COLUMN \`whatsapp_enabled\`;`)
  } catch {
    // ignore
  }
  try {
    await db.run(sql`ALTER TABLE \`integrations_settings\` DROP COLUMN \`whatsapp_phone_number\`;`)
  } catch {
    // ignore
  }
  try {
    await db.run(sql`ALTER TABLE \`integrations_settings\` DROP COLUMN \`whatsapp_position\`;`)
  } catch {
    // ignore
  }
}
