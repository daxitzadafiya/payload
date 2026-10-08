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
 * Virtual Assistant embed settings on Integrations global.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(
    db,
    'integrations_settings',
    'virtual_assistant_enabled',
    'integer DEFAULT 0',
  )
  await addColumnIfMissing(db, 'integrations_settings', 'virtual_assistant_embed_script', 'text')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  try {
    await db.run(
      sql`ALTER TABLE \`integrations_settings\` DROP COLUMN \`virtual_assistant_enabled\`;`,
    )
  } catch {
    // ignore
  }
  try {
    await db.run(
      sql`ALTER TABLE \`integrations_settings\` DROP COLUMN \`virtual_assistant_embed_script\`;`,
    )
  } catch {
    // ignore
  }
}
