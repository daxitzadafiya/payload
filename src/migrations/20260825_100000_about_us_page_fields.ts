import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition}`))
  } catch {
    // Column already exists when schema was pushed ahead of migrations.
  }
}

/**
 * About Us page fields:
 * - Hero CTA + stats bar
 * - Mission / Who We Are collage images
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ['pages_blocks_about_us_hero_block', '_pages_v_blocks_about_us_hero_block'] as const) {
    await addColumnIfMissing(db, table, 'cta_link_type', "text DEFAULT 'reference'")
    await addColumnIfMissing(db, table, 'cta_link_new_tab', 'integer')
  }

  for (const table of [
    'pages_blocks_about_us_hero_block_locales',
    '_pages_v_blocks_about_us_hero_block_locales',
  ] as const) {
    await addColumnIfMissing(db, table, 'button_text', 'text')
    await addColumnIfMissing(db, table, 'cta_link_url', 'text')
    await addColumnIfMissing(db, table, 'cta_link_label', 'text')
  }

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pages_blocks_about_us_hero_block_stats\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`icon\` text DEFAULT 'award',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_about_us_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_about_us_hero_block_stats_order_idx\` ON \`pages_blocks_about_us_hero_block_stats\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_about_us_hero_block_stats_parent_id_idx\` ON \`pages_blocks_about_us_hero_block_stats\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pages_blocks_about_us_hero_block_stats_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`value\` text,
      \`label\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_about_us_hero_block_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`pages_blocks_about_us_hero_block_stats_locales_locale_parent_id_unique\` ON \`pages_blocks_about_us_hero_block_stats_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pages_v_blocks_about_us_hero_block_stats\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`icon\` text DEFAULT 'award',
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_about_us_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_about_us_hero_block_stats_order_idx\` ON \`_pages_v_blocks_about_us_hero_block_stats\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_about_us_hero_block_stats_parent_id_idx\` ON \`_pages_v_blocks_about_us_hero_block_stats\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pages_v_blocks_about_us_hero_block_stats_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`value\` text,
      \`label\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_about_us_hero_block_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_pages_v_blocks_about_us_hero_block_stats_locales_locale_parent_id_uniqu\` ON \`_pages_v_blocks_about_us_hero_block_stats_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  for (const table of [
    'pages_blocks_mission_block',
    '_pages_v_blocks_mission_block',
    'pages_blocks_who_we_are_block',
    '_pages_v_blocks_who_we_are_block',
  ] as const) {
    await addColumnIfMissing(db, table, 'collage_image2_id', 'integer')
    await addColumnIfMissing(db, table, 'collage_image3_id', 'integer')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_about_us_hero_block_stats_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_about_us_hero_block_stats\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_about_us_hero_block_stats_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_about_us_hero_block_stats\`;`)
}
