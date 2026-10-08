import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`default_property_tab\` text DEFAULT 'sale';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`default_country\` text DEFAULT 'spain';`,
  )

  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`default_property_tab\` text DEFAULT 'sale';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`default_country\` text DEFAULT 'spain';`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`default_country\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`default_property_tab\`;`,
  )

  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`default_country\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`default_property_tab\`;`)
}
