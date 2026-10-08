import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`search_results_link_type\` text DEFAULT 'custom';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`search_results_link_new_tab\` integer;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block_locales\` ADD \`search_results_link_url\` text;`,
  )

  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`search_results_link_type\` text DEFAULT 'custom';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`search_results_link_new_tab\` integer;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block_locales\` ADD \`search_results_link_url\` text;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block_locales\` DROP COLUMN \`search_results_link_url\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`search_results_link_new_tab\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`search_results_link_type\`;`,
  )

  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block_locales\` DROP COLUMN \`search_results_link_url\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`search_results_link_new_tab\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`search_results_link_type\`;`,
  )
}
