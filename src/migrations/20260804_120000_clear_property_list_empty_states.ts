import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Clear Favorites-only empty-state copy from Property List blocks that are not
 * the Favorites preset (defaults were previously persisted for every preset).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    UPDATE \`pages_blocks_property_list_block_locales\`
    SET
      \`empty_state_no_favorites_title\` = NULL,
      \`empty_state_no_favorites_description\` = NULL,
      \`empty_state_no_results_title\` = NULL,
      \`empty_state_no_results_description\` = NULL
    WHERE \`_parent_id\` IN (
      SELECT \`id\` FROM \`pages_blocks_property_list_block\`
      WHERE \`listing_preset\` IS NULL OR \`listing_preset\` != 'favorites'
    )
  `)

  await db.run(sql`
    UPDATE \`_pages_v_blocks_property_list_block_locales\`
    SET
      \`empty_state_no_favorites_title\` = NULL,
      \`empty_state_no_favorites_description\` = NULL,
      \`empty_state_no_results_title\` = NULL,
      \`empty_state_no_results_description\` = NULL
    WHERE \`_parent_id\` IN (
      SELECT \`id\` FROM \`_pages_v_blocks_property_list_block\`
      WHERE \`listing_preset\` IS NULL OR \`listing_preset\` != 'favorites'
    )
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Data cleanup — no restore of previous empty-state defaults.
}
