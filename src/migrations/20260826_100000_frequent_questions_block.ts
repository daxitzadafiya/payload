import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * FrequentQuestionsBlock (dbName: faq / faq_items).
 * Localized title, lead, intro + Q&A items (question + richText answer).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`faq\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`faq_order_idx\` ON \`faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`faq_parent_id_idx\` ON \`faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`faq_path_idx\` ON \`faq\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`faq_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`eyebrow\` text DEFAULT 'Buying guide',
      \`title\` text DEFAULT 'Frequent questions',
      \`lead\` text DEFAULT 'You are in a position to realise your dream of having a place in the sun...',
      \`intro_heading\` text DEFAULT 'Buying a Property in Spain: Frequently Asked Questions',
      \`intro\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`faq_locales_locale_parent_id_unique\` ON \`faq_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`faq_items\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`faq_items_order_idx\` ON \`faq_items\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`faq_items_parent_id_idx\` ON \`faq_items\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`faq_items_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`question\` text,
      \`answer\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`faq_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`faq_items_locales_locale_parent_id_unique\` ON \`faq_items_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_faq_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faq_v_order_idx\` ON \`_faq_v\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_faq_v_parent_id_idx\` ON \`_faq_v\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_faq_v_path_idx\` ON \`_faq_v\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_faq_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`eyebrow\` text DEFAULT 'Buying guide',
      \`title\` text DEFAULT 'Frequent questions',
      \`lead\` text DEFAULT 'You are in a position to realise your dream of having a place in the sun...',
      \`intro_heading\` text DEFAULT 'Buying a Property in Spain: Frequently Asked Questions',
      \`intro\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_faq_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_faq_v_locales_locale_parent_id_unique\` ON \`_faq_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_faq_items_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_faq_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_faq_items_v_order_idx\` ON \`_faq_items_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_faq_items_v_parent_id_idx\` ON \`_faq_items_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_faq_items_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`question\` text,
      \`answer\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_faq_items_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_faq_items_v_locales_locale_parent_id_unique\` ON \`_faq_items_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_faq_items_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_faq_items_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_faq_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_faq_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`faq_items_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`faq_items\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`faq_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`faq\`;`)
}
