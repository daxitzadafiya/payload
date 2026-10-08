import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * SellYourPropertyBlock (dbName: sell_prop / sell_off / sell_qt).
 * Localized masthead, offers, CTA link, client quotes, closing.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`sell_prop\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`cta_link_type\` text DEFAULT 'reference',
      \`cta_link_new_tab\` integer DEFAULT false,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`sell_prop_order_idx\` ON \`sell_prop\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`sell_prop_parent_id_idx\` ON \`sell_prop\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`sell_prop_path_idx\` ON \`sell_prop\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`sell_prop_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`eyebrow\` text DEFAULT 'Sell',
      \`title\` text DEFAULT 'Sell your property with Zariko',
      \`intro_heading\` text DEFAULT 'Thinking about selling?',
      \`intro_lead\` text DEFAULT 'Let''s talk — with us by your side, your home is as good as sold.',
      \`highlight\` text,
      \`offers_heading\` text DEFAULT 'What we offer you:',
      \`cta_label\` text DEFAULT 'GET IN TOUCH!',
      \`cta_link_url\` text,
      \`why_heading\` text DEFAULT 'Why do others choose us?',
      \`why_lead\` text DEFAULT 'Our clients say it best:',
      \`closing\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`sell_prop\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`sell_prop_locales_locale_parent_id_unique\` ON \`sell_prop_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`sell_off\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`sell_prop\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`sell_off_order_idx\` ON \`sell_off\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`sell_off_parent_id_idx\` ON \`sell_off\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`sell_off_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`sell_off\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`sell_off_locales_locale_parent_id_unique\` ON \`sell_off_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`sell_qt\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`sell_prop\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`sell_qt_order_idx\` ON \`sell_qt\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`sell_qt_parent_id_idx\` ON \`sell_qt\` (\`_parent_id\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`sell_qt_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`sell_qt\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`sell_qt_locales_locale_parent_id_unique\` ON \`sell_qt_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  // Version tables
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_sell_prop_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`cta_link_type\` text DEFAULT 'reference',
      \`cta_link_new_tab\` integer DEFAULT false,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_sell_prop_v_order_idx\` ON \`_sell_prop_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_sell_prop_v_parent_id_idx\` ON \`_sell_prop_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_sell_prop_v_path_idx\` ON \`_sell_prop_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_sell_prop_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`eyebrow\` text DEFAULT 'Sell',
      \`title\` text DEFAULT 'Sell your property with Zariko',
      \`intro_heading\` text DEFAULT 'Thinking about selling?',
      \`intro_lead\` text DEFAULT 'Let''s talk — with us by your side, your home is as good as sold.',
      \`highlight\` text,
      \`offers_heading\` text DEFAULT 'What we offer you:',
      \`cta_label\` text DEFAULT 'GET IN TOUCH!',
      \`cta_link_url\` text,
      \`why_heading\` text DEFAULT 'Why do others choose us?',
      \`why_lead\` text DEFAULT 'Our clients say it best:',
      \`closing\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_sell_prop_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_sell_prop_v_locales_locale_parent_id_unique\` ON \`_sell_prop_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_sell_off_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_sell_prop_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_sell_off_v_order_idx\` ON \`_sell_off_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_sell_off_v_parent_id_idx\` ON \`_sell_off_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_sell_off_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_sell_off_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_sell_off_v_locales_locale_parent_id_unique\` ON \`_sell_off_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_sell_qt_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_sell_prop_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_sell_qt_v_order_idx\` ON \`_sell_qt_v\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_sell_qt_v_parent_id_idx\` ON \`_sell_qt_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_sell_qt_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_sell_qt_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_sell_qt_v_locales_locale_parent_id_unique\` ON \`_sell_qt_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_sell_qt_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_sell_qt_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_sell_off_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_sell_off_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_sell_prop_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_sell_prop_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`sell_qt_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`sell_qt\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`sell_off_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`sell_off\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`sell_prop_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`sell_prop\`;`)
}
