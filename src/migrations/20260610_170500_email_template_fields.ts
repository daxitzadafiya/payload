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
  await addColumnIfMissing(db, 'email_settings', 'client_confirmation_enabled', 'integer DEFAULT true')
  await addColumnIfMissing(
    db,
    'email_settings',
    'client_confirmation_show_footer_contact',
    'integer DEFAULT true',
  )
  await addColumnIfMissing(
    db,
    'email_settings',
    'client_confirmation_show_social_links',
    'integer DEFAULT true',
  )

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`email_settings_locales\` (
  	\`team_notifications_contact_subject\` text,
  	\`team_notifications_contact_name\` text,
  	\`team_notifications_contact_content\` text,
  	\`team_notifications_property_inquiry_subject\` text,
  	\`team_notifications_property_inquiry_name\` text,
  	\`team_notifications_property_inquiry_content\` text,
  	\`client_confirmation_contact_subject\` text,
  	\`client_confirmation_contact_name\` text,
  	\`client_confirmation_contact_content\` text,
  	\`client_confirmation_property_inquiry_subject\` text,
  	\`client_confirmation_property_inquiry_name\` text,
  	\`client_confirmation_property_inquiry_content\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`email_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`email_settings_locales_locale_parent_id_unique\` ON \`email_settings_locales\` (\`_locale\`,\`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`email_settings_locales\`;`)
}
