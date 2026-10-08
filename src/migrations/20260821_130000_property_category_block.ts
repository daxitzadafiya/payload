import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * PropertyCategoryBlock (dbName: prop_cat / pc_cards).
 * Kept for fresh installs; live DBs that already ran the wrong-named tables
 * are repaired by 20260821_131000_fix_prop_cat_table_names.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`prop_cat\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`prop_cat_order_idx\` ON \`prop_cat\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`prop_cat_parent_id_idx\` ON \`prop_cat\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`prop_cat_path_idx\` ON \`prop_cat\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pc_cards\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`property_preset\` text DEFAULT 'featured',
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`prop_cat\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pc_cards_order_idx\` ON \`pc_cards\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pc_cards_parent_id_idx\` ON \`pc_cards\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pc_cards_image_idx\` ON \`pc_cards\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pc_cards_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`title_suffix\` text DEFAULT 'Properties',
      \`subtitle\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pc_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`pc_cards_locales_locale_parent_id_unique\` ON \`pc_cards_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_prop_cat_v\` (
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
    sql`CREATE INDEX IF NOT EXISTS \`_prop_cat_v_order_idx\` ON \`_prop_cat_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_prop_cat_v_parent_id_idx\` ON \`_prop_cat_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_prop_cat_v_path_idx\` ON \`_prop_cat_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pc_cards_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`property_preset\` text DEFAULT 'featured',
      \`_uuid\` text,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_prop_cat_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pc_cards_v_order_idx\` ON \`_pc_cards_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pc_cards_v_parent_id_idx\` ON \`_pc_cards_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pc_cards_v_image_idx\` ON \`_pc_cards_v\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pc_cards_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`title_suffix\` text DEFAULT 'Properties',
      \`subtitle\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pc_cards_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_pc_cards_v_locales_locale_parent_id_unique\` ON \`_pc_cards_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_pc_cards_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_pc_cards_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_prop_cat_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pc_cards_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pc_cards\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`prop_cat\`;`)
}
