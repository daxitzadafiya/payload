import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * WelcomeBlock: title, description, buttonText (localized) + ctaLink.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pages_blocks_welcome_block\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`cta_link_type\` text DEFAULT 'reference',
      \`cta_link_new_tab\` integer,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_welcome_block_order_idx\` ON \`pages_blocks_welcome_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_welcome_block_parent_id_idx\` ON \`pages_blocks_welcome_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_welcome_block_path_idx\` ON \`pages_blocks_welcome_block\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pages_blocks_welcome_block_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`description\` text,
      \`button_text\` text,
      \`cta_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_welcome_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`pages_blocks_welcome_block_locales_locale_parent_id_uniqu\` ON \`pages_blocks_welcome_block_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pages_v_blocks_welcome_block\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`cta_link_type\` text DEFAULT 'reference',
      \`cta_link_new_tab\` integer,
      \`_uuid\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_welcome_block_order_idx\` ON \`_pages_v_blocks_welcome_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_welcome_block_parent_id_idx\` ON \`_pages_v_blocks_welcome_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_welcome_block_path_idx\` ON \`_pages_v_blocks_welcome_block\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pages_v_blocks_welcome_block_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`description\` text,
      \`button_text\` text,
      \`cta_link_url\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_welcome_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_pages_v_blocks_welcome_block_locales_locale_parent_id_un\` ON \`_pages_v_blocks_welcome_block_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_welcome_block_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_welcome_block\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_welcome_block_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_welcome_block\`;`)
}
