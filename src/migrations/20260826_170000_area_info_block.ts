import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * AreaInfoBlock (dbName: area_info / ai_hlite / ai_card).
 * Localized masthead + area list + photo cards with CTA URLs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`area_info\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`area_info_order_idx\` ON \`area_info\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`area_info_parent_id_idx\` ON \`area_info\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`area_info_path_idx\` ON \`area_info\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`area_info_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text DEFAULT 'Areas',
      \`subtitle\` text DEFAULT 'Popular Residential Areas on the Costa del Sol',
      \`intro\` text DEFAULT 'The Costa del Sol is one of Europe’s most sought-after stretches of coastline — a landscape of mountains, marinas, golf, and year-round Mediterranean light. Discover the neighbourhoods our clients love most.',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`area_info\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`area_info_locales_locale_parent_id_unique\` ON \`area_info_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ai_hlite\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`area_info\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ai_hlite_order_idx\` ON \`ai_hlite\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`ai_hlite_parent_id_idx\` ON \`ai_hlite\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ai_hlite_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`name\` text,
      \`description\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`ai_hlite\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`ai_hlite_locales_locale_parent_id_unique\` ON \`ai_hlite_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ai_card\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`cta_link_type\` text DEFAULT 'reference',
      \`cta_link_new_tab\` integer DEFAULT false,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`area_info\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ai_card_order_idx\` ON \`ai_card\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`ai_card_parent_id_idx\` ON \`ai_card\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`ai_card_image_idx\` ON \`ai_card\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ai_card_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`description\` text,
      \`cta_label\` text,
      \`cta_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`ai_card\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`ai_card_locales_locale_parent_id_unique\` ON \`ai_card_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_area_info_v\` (
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
    sql`CREATE INDEX IF NOT EXISTS \`_area_info_v_order_idx\` ON \`_area_info_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_area_info_v_parent_id_idx\` ON \`_area_info_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_area_info_v_path_idx\` ON \`_area_info_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_area_info_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text DEFAULT 'Areas',
      \`subtitle\` text DEFAULT 'Popular Residential Areas on the Costa del Sol',
      \`intro\` text DEFAULT 'The Costa del Sol is one of Europe’s most sought-after stretches of coastline — a landscape of mountains, marinas, golf, and year-round Mediterranean light. Discover the neighbourhoods our clients love most.',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_area_info_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_area_info_v_locales_locale_parent_id_unique\` ON \`_area_info_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ai_hlite_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_area_info_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ai_hlite_v_order_idx\` ON \`_ai_hlite_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ai_hlite_v_parent_id_idx\` ON \`_ai_hlite_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ai_hlite_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`name\` text,
      \`description\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ai_hlite_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_ai_hlite_v_locales_locale_parent_id_unique\` ON \`_ai_hlite_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ai_card_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`image_id\` integer,
      \`cta_link_type\` text DEFAULT 'reference',
      \`cta_link_new_tab\` integer DEFAULT false,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_area_info_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ai_card_v_order_idx\` ON \`_ai_card_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ai_card_v_parent_id_idx\` ON \`_ai_card_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ai_card_v_image_idx\` ON \`_ai_card_v\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ai_card_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`description\` text,
      \`cta_label\` text,
      \`cta_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ai_card_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_ai_card_v_locales_locale_parent_id_unique\` ON \`_ai_card_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_ai_card_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ai_card_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ai_hlite_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ai_hlite_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_area_info_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_area_info_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ai_card_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ai_card\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ai_hlite_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ai_hlite\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`area_info_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`area_info\`;`)
}
