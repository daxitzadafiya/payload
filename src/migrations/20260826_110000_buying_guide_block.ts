import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * BuyingGuideBlock (dbName: buy_guide / bg_steps).
 * Localized title, lead, timeline steps (title + richText body), closing CTA.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`buy_guide\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`buy_guide_order_idx\` ON \`buy_guide\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`buy_guide_parent_id_idx\` ON \`buy_guide\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`buy_guide_path_idx\` ON \`buy_guide\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`buy_guide_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`eyebrow\` text DEFAULT 'Help & advice',
      \`title\` text DEFAULT 'Buying guide in Spain: Zariko Plan',
      \`lead\` text DEFAULT 'A clear path from first conversation to keys in hand — budget, locations, process, taxes, and more.',
      \`closing_heading\` text DEFAULT 'Successful buying in Spain — request our free comprehensive guide',
      \`closing_body\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`buy_guide\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`buy_guide_locales_locale_parent_id_unique\` ON \`buy_guide_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`bg_steps\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`buy_guide\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`bg_steps_order_idx\` ON \`bg_steps\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`bg_steps_parent_id_idx\` ON \`bg_steps\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`bg_steps_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`body\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`bg_steps\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`bg_steps_locales_locale_parent_id_unique\` ON \`bg_steps_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_buy_guide_v\` (
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
    sql`CREATE INDEX IF NOT EXISTS \`_buy_guide_v_order_idx\` ON \`_buy_guide_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_buy_guide_v_parent_id_idx\` ON \`_buy_guide_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_buy_guide_v_path_idx\` ON \`_buy_guide_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_buy_guide_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`eyebrow\` text DEFAULT 'Help & advice',
      \`title\` text DEFAULT 'Buying guide in Spain: Zariko Plan',
      \`lead\` text DEFAULT 'A clear path from first conversation to keys in hand — budget, locations, process, taxes, and more.',
      \`closing_heading\` text DEFAULT 'Successful buying in Spain — request our free comprehensive guide',
      \`closing_body\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_buy_guide_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_buy_guide_v_locales_locale_parent_id_unique\` ON \`_buy_guide_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_bg_steps_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_buy_guide_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_bg_steps_v_order_idx\` ON \`_bg_steps_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_bg_steps_v_parent_id_idx\` ON \`_bg_steps_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_bg_steps_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`body\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_bg_steps_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_bg_steps_v_locales_locale_parent_id_unique\` ON \`_bg_steps_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_bg_steps_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_bg_steps_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_buy_guide_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_buy_guide_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`bg_steps_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`bg_steps\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`buy_guide_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`buy_guide\`;`)
}
