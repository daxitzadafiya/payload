import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function dropColumnIfExists(db: MigrateUpArgs['db'], table: string, column: string) {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column missing or SQLite version does not support DROP COLUMN.
  }
}

/**
 * Remove unused Seal / Badge upload columns from Mission and Who We Are blocks.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const name of [
    'pages_blocks_mission_block_seal_image_idx',
    'pages_blocks_who_we_are_block_seal_image_idx',
    '_pages_v_blocks_mission_block_seal_image_idx',
    '_pages_v_blocks_who_we_are_block_seal_image_idx',
  ] as const) {
    await db.run(sql.raw(`DROP INDEX IF EXISTS \`${name}\``))
  }

  for (const table of [
    'pages_blocks_mission_block',
    '_pages_v_blocks_mission_block',
    'pages_blocks_who_we_are_block',
    '_pages_v_blocks_who_we_are_block',
  ] as const) {
    await dropColumnIfExists(db, table, 'seal_image_id')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [
    'pages_blocks_mission_block',
    '_pages_v_blocks_mission_block',
    'pages_blocks_who_we_are_block',
    '_pages_v_blocks_who_we_are_block',
  ] as const) {
    try {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`seal_image_id\` integer`))
    } catch {
      // Column already exists.
    }
  }
}
