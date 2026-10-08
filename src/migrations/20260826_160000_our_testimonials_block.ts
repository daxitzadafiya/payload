import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * OurTestimonialsBlock (dbName: our_tmnl / ot_item).
 * Localized title + intro + testimonial quote/attribution array.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`our_tmnl\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`our_tmnl_order_idx\` ON \`our_tmnl\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`our_tmnl_parent_id_idx\` ON \`our_tmnl\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`our_tmnl_path_idx\` ON \`our_tmnl\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`our_tmnl_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text DEFAULT 'What our clients say',
      \`intro\` text DEFAULT 'At Zariko we are proud of the feedback we receive from our clients. It reflects the dedication, transparency and personal service we put into every step of the buying and selling journey.',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`our_tmnl\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`our_tmnl_locales_locale_parent_id_unique\` ON \`our_tmnl_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ot_item\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`our_tmnl\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ot_item_order_idx\` ON \`ot_item\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`ot_item_parent_id_idx\` ON \`ot_item\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ot_item_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`quote\` text,
      \`attribution\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`ot_item\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`ot_item_locales_locale_parent_id_unique\` ON \`ot_item_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_our_tmnl_v\` (
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
    sql`CREATE INDEX IF NOT EXISTS \`_our_tmnl_v_order_idx\` ON \`_our_tmnl_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_our_tmnl_v_parent_id_idx\` ON \`_our_tmnl_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_our_tmnl_v_path_idx\` ON \`_our_tmnl_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_our_tmnl_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text DEFAULT 'What our clients say',
      \`intro\` text DEFAULT 'At Zariko we are proud of the feedback we receive from our clients. It reflects the dedication, transparency and personal service we put into every step of the buying and selling journey.',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_our_tmnl_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_our_tmnl_v_locales_locale_parent_id_unique\` ON \`_our_tmnl_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ot_item_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_our_tmnl_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ot_item_v_order_idx\` ON \`_ot_item_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ot_item_v_parent_id_idx\` ON \`_ot_item_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ot_item_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`quote\` text,
      \`attribution\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ot_item_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_ot_item_v_locales_locale_parent_id_unique\` ON \`_ot_item_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_ot_item_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ot_item_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_our_tmnl_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_our_tmnl_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ot_item_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ot_item\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`our_tmnl_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`our_tmnl\`;`)
}
