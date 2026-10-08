import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * ServicesBlock (dbName: services / svc_items).
 * Main title + description; items with icon, title, description, button text + link.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`services\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`services_order_idx\` ON \`services\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`services_parent_id_idx\` ON \`services\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`services_path_idx\` ON \`services\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`services_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`description\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`services_locales_locale_parent_id_unique\` ON \`services_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`svc_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`icon\` text DEFAULT 'key',
      \`button_link_type\` text DEFAULT 'reference',
      \`button_link_new_tab\` integer,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`svc_items_order_idx\` ON \`svc_items\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`svc_items_parent_id_idx\` ON \`svc_items\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`svc_items_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`description\` text,
      \`button_text\` text DEFAULT 'More Info',
      \`button_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`svc_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`svc_items_locales_locale_parent_id_unique\` ON \`svc_items_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_services_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_services_v_order_idx\` ON \`_services_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_services_v_parent_id_idx\` ON \`_services_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_services_v_path_idx\` ON \`_services_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_services_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`description\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_services_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_services_v_locales_locale_parent_id_unique\` ON \`_services_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_svc_items_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`icon\` text DEFAULT 'key',
      \`button_link_type\` text DEFAULT 'reference',
      \`button_link_new_tab\` integer,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_services_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_svc_items_v_order_idx\` ON \`_svc_items_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_svc_items_v_parent_id_idx\` ON \`_svc_items_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_svc_items_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`description\` text,
      \`button_text\` text DEFAULT 'More Info',
      \`button_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_svc_items_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_svc_items_v_locales_locale_parent_id_unique\` ON \`_svc_items_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_svc_items_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_svc_items_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_services_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_services_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`svc_items_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`svc_items\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`services_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`services\`;`)
}
