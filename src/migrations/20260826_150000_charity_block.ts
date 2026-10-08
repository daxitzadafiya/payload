import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * CharityBlock (dbName: charity).
 * Localized masthead + body richText; shared video URL + localized caption.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`charity\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`video_url\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`charity_order_idx\` ON \`charity\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`charity_parent_id_idx\` ON \`charity\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`charity_path_idx\` ON \`charity\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`charity_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`eyebrow\` text DEFAULT 'About us',
      \`title\` text DEFAULT 'Charity',
      \`subtitle\` text DEFAULT 'Together for a Better World — Zariko & Triple A Marbella',
      \`body\` text,
      \`video_caption\` text DEFAULT 'Refugio Triple A Marbella',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`charity\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`charity_locales_locale_parent_id_unique\` ON \`charity_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_charity_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`video_url\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_charity_v_order_idx\` ON \`_charity_v\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_charity_v_parent_id_idx\` ON \`_charity_v\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_charity_v_path_idx\` ON \`_charity_v\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_charity_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`eyebrow\` text DEFAULT 'About us',
      \`title\` text DEFAULT 'Charity',
      \`subtitle\` text DEFAULT 'Together for a Better World — Zariko & Triple A Marbella',
      \`body\` text,
      \`video_caption\` text DEFAULT 'Refugio Triple A Marbella',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_charity_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_charity_v_locales_locale_parent_id_unique\` ON \`_charity_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_charity_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_charity_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`charity_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`charity\`;`)
}
