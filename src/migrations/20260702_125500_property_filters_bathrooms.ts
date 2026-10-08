import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`property_filters_bathrooms\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`value\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`property_filters_bathrooms_order_idx\` ON \`property_filters_bathrooms\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`property_filters_bathrooms_parent_id_idx\` ON \`property_filters_bathrooms\` (\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`property_filters_bathrooms_locales\` (
	\`label\` text,
	\`id\` integer PRIMARY KEY NOT NULL,
	\`_locale\` text NOT NULL,
	\`_parent_id\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_bathrooms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`property_filters_bathrooms_locales_locale_parent_id_unique\` ON \`property_filters_bathrooms_locales\` (\`_locale\`,\`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`property_filters_bathrooms_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`property_filters_bathrooms\`;`)
}
