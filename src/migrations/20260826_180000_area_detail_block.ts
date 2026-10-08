import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * AreaDetailBlock (dbName: area_dtl / ad_stat / ad_dist).
 * Localized area story + map coords + about/distance stats.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`area_dtl\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`map_lat\` numeric NOT NULL,
      \`map_lng\` numeric NOT NULL,
      \`map_zoom\` numeric DEFAULT 12,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`area_dtl_order_idx\` ON \`area_dtl\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`area_dtl_parent_id_idx\` ON \`area_dtl\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`area_dtl_path_idx\` ON \`area_dtl\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`area_dtl_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`title\` text,
      \`subtitle\` text,
      \`body\` text,
      \`closing\` text,
      \`about_heading\` text,
      \`distances_heading\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`area_dtl\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`area_dtl_locales_locale_parent_id_unique\` ON \`area_dtl_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ad_stat\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`area_dtl\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ad_stat_order_idx\` ON \`ad_stat\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`ad_stat_parent_id_idx\` ON \`ad_stat\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ad_stat_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`label\` text,
      \`value\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`ad_stat\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`ad_stat_locales_locale_parent_id_unique\` ON \`ad_stat_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ad_dist\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`area_dtl\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ad_dist_order_idx\` ON \`ad_dist\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`ad_dist_parent_id_idx\` ON \`ad_dist\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ad_dist_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`label\` text,
      \`value\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`ad_dist\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`ad_dist_locales_locale_parent_id_unique\` ON \`ad_dist_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_area_dtl_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`map_lat\` numeric,
      \`map_lng\` numeric,
      \`map_zoom\` numeric DEFAULT 12,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_area_dtl_v_order_idx\` ON \`_area_dtl_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_area_dtl_v_parent_id_idx\` ON \`_area_dtl_v\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_area_dtl_v_path_idx\` ON \`_area_dtl_v\` (\`_path\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_area_dtl_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`title\` text,
      \`subtitle\` text,
      \`body\` text,
      \`closing\` text,
      \`about_heading\` text,
      \`distances_heading\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_area_dtl_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_area_dtl_v_locales_locale_parent_id_unique\` ON \`_area_dtl_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ad_stat_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_area_dtl_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ad_stat_v_order_idx\` ON \`_ad_stat_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ad_stat_v_parent_id_idx\` ON \`_ad_stat_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ad_stat_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`label\` text,
      \`value\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ad_stat_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_ad_stat_v_locales_locale_parent_id_unique\` ON \`_ad_stat_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ad_dist_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_area_dtl_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ad_dist_v_order_idx\` ON \`_ad_dist_v\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ad_dist_v_parent_id_idx\` ON \`_ad_dist_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ad_dist_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`label\` text,
      \`value\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ad_dist_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_ad_dist_v_locales_locale_parent_id_unique\` ON \`_ad_dist_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_ad_dist_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ad_dist_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ad_stat_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ad_stat_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_area_dtl_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_area_dtl_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ad_dist_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ad_dist\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ad_stat_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ad_stat\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`area_dtl_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`area_dtl\`;`)
}
