import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * InfoCardsBlock (dbName: info_cards / info_items).
 * Cards: image, title, description, button text + link.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`info_cards\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`info_cards_order_idx\` ON \`info_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`info_cards_parent_id_idx\` ON \`info_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`info_cards_path_idx\` ON \`info_cards\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`info_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`button_link_type\` text DEFAULT 'reference',
      \`button_link_new_tab\` integer,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`info_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`info_items_order_idx\` ON \`info_items\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`info_items_parent_id_idx\` ON \`info_items\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`info_items_image_idx\` ON \`info_items\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`info_items_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`description\` text,
      \`button_text\` text DEFAULT 'View More',
      \`button_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`info_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`info_items_locales_locale_parent_id_unique\` ON \`info_items_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_info_cards_v\` (
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
    sql`CREATE INDEX IF NOT EXISTS \`_info_cards_v_order_idx\` ON \`_info_cards_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_info_cards_v_parent_id_idx\` ON \`_info_cards_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_info_cards_v_path_idx\` ON \`_info_cards_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_info_items_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`button_link_type\` text DEFAULT 'reference',
      \`button_link_new_tab\` integer,
      \`_uuid\` text,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_info_cards_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_info_items_v_order_idx\` ON \`_info_items_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_info_items_v_parent_id_idx\` ON \`_info_items_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_info_items_v_image_idx\` ON \`_info_items_v\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_info_items_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`description\` text,
      \`button_text\` text DEFAULT 'View More',
      \`button_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_info_items_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_info_items_v_locales_locale_parent_id_unique\` ON \`_info_items_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_info_items_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_info_items_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_info_cards_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`info_items_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`info_items\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`info_cards\`;`)
}
