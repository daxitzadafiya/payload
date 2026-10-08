import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Convert Countries from a Global (array) to a Collection (one doc per country)
 * so admin gets search + pagination like Translations.
 * Preserves showOnSite / offer* flags from the previous global array rows.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`countries_collection\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`admin_label\` text NOT NULL,
	\`iso_code\` text,
	\`key\` numeric NOT NULL,
	\`status\` text,
	\`crm_id\` text,
	\`names\` text NOT NULL,
	\`show_on_site\` integer DEFAULT 0,
	\`offer_sale\` integer DEFAULT 0,
	\`offer_rental\` integer DEFAULT 0,
	\`offer_holiday\` integer DEFAULT 0,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`)

  // Copy from previous global array table when present.
  await db.run(sql`
    INSERT INTO \`countries_collection\` (
      \`admin_label\`, \`iso_code\`, \`key\`, \`status\`, \`crm_id\`, \`names\`,
      \`show_on_site\`, \`offer_sale\`, \`offer_rental\`, \`offer_holiday\`,
      \`updated_at\`, \`created_at\`
    )
    SELECT
      COALESCE(NULLIF(\`admin_label\`, ''), COALESCE(\`iso_code\`, CAST(\`key\` AS text))),
      \`iso_code\`,
      \`key\`,
      \`status\`,
      \`crm_id\`,
      COALESCE(\`names\`, '{}'),
      COALESCE(\`show_on_site\`, 0),
      COALESCE(\`offer_sale\`, 0),
      COALESCE(\`offer_rental\`, 0),
      COALESCE(\`offer_holiday\`, 0),
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    FROM \`countries_countries\`
    WHERE \`key\` IS NOT NULL
    ORDER BY \`_order\`
  `)

  await db.run(sql`DROP TABLE IF EXISTS \`countries_countries\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`countries\`;`)
  await db.run(sql`ALTER TABLE \`countries_collection\` RENAME TO \`countries\`;`)

  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`countries_key_idx\` ON \`countries\` (\`key\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`countries_admin_label_idx\` ON \`countries\` (\`admin_label\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`countries_iso_code_idx\` ON \`countries\` (\`iso_code\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`countries_show_on_site_idx\` ON \`countries\` (\`show_on_site\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`countries_offer_sale_idx\` ON \`countries\` (\`offer_sale\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`countries_updated_at_idx\` ON \`countries\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`countries_created_at_idx\` ON \`countries\` (\`created_at\`);`)

  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`countries_id\` integer REFERENCES \`countries\`(\`id\`) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_countries_id_idx\` ON \`payload_locked_documents_rels\` (\`countries_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_countries_id_idx\`;`)

  // Recreate global-shaped tables (empty) for rollback compatibility.
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`countries_global\` (
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
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`countries_global\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  await db.run(sql`DROP TABLE IF EXISTS \`countries\`;`)
  await db.run(sql`ALTER TABLE \`countries_global\` RENAME TO \`countries\`;`)
}
