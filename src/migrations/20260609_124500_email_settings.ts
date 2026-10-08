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
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`email_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`enabled\` integer,
  	\`smtp_host\` text,
  	\`smtp_port\` numeric DEFAULT 587,
  	\`smtp_secure\` integer,
  	\`smtp_user\` text,
  	\`smtp_password\` text,
  	\`sender_from_address\` text,
  	\`sender_from_name\` text DEFAULT 'Horizon Estates',
  	\`notifications_recipient_address\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );`)

  await addColumnIfMissing(db, 'form_submissions', 'recaptcha_required', 'integer')
  await addColumnIfMissing(db, 'form_submissions', 'recaptcha_token', 'text')
  await addColumnIfMissing(db, 'form_submissions', 'sync_to_optima_crm', 'integer')
  await addColumnIfMissing(db, 'form_submissions', 'submission_locale', 'text')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`email_settings\`;`)
}
