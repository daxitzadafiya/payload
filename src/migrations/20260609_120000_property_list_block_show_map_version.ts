import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/** Pages with drafts query the version block table — show_map was missing there. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_property_list_block\` ADD \`show_map\` integer;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_property_list_block\` DROP COLUMN \`show_map\`;`,
  )
}
