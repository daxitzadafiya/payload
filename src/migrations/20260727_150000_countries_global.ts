import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`countries\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`last_synced_at\` text,
	\`updated_at\` text,
	\`created_at\` text
  );`)

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`countries_countries\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`admin_label\` text,
	\`iso_code\` text,
	\`key\` numeric,
	\`status\` text,
	\`crm_id\` text,
	\`names\` text,
	\`show_on_site\` integer DEFAULT 0,
	\`offer_sale\` integer DEFAULT 0,
	\`offer_rental\` integer DEFAULT 0,
	\`offer_holiday\` integer DEFAULT 0,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`countries\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`countries_countries_order_idx\` ON \`countries_countries\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`countries_countries_parent_id_idx\` ON \`countries_countries\` (\`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`countries_countries\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`countries\`;`)
}
