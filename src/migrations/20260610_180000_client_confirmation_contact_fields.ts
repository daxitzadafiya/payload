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
    'email_settings',
    'client_confirmation_show_contact_details',
    'integer DEFAULT true',
  )
  await addColumnIfMissing(db, 'email_settings', 'client_confirmation_contact_details_email', 'text')
  await addColumnIfMissing(db, 'email_settings', 'client_confirmation_contact_details_phone', 'text')
  await addColumnIfMissing(
    db,
    'email_settings',
    'client_confirmation_contact_details_website',
    'text',
  )

  await addColumnIfMissing(
    db,
    'email_settings_locales',
    'client_confirmation_contact_details_address',
    'text',
  )

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`email_settings_client_confirmation_social_links\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`_order\` integer,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`email_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`email_settings_client_confirmation_social_links_order_idx\` ON \`email_settings_client_confirmation_social_links\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`email_settings_client_confirmation_social_links_parent_id_idx\` ON \`email_settings_client_confirmation_social_links\` (\`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`email_settings_client_confirmation_social_links\`;`)
}
