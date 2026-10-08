import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function tableHasColumn(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(
    sql.raw(`PRAGMA table_info(\`${table}\`)`),
  )
  return columns.some((entry) => entry.name === column)
}

async function tableExists(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const tables = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${table}`,
  )
  return tables.length > 0
}

/**
 * Payload hasMany select tables require an integer `id` primary key.
 * Skip when the first migration already created tables with `id`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const tableName = 'pages_blocks_hero_block_property_tabs_visible_tabs'
  const versionTableName = '_pages_v_blocks_hero_block_property_tabs_visible_tabs'

  if (!(await tableExists(db, tableName))) return
  if (await tableHasColumn(db, tableName, 'id')) return

  await db.run(sql`CREATE TABLE \`pages_blocks_hero_block_property_tabs_visible_tabs_new\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer NOT NULL,
    \`parent_id\` text NOT NULL,
    \`value\` text NOT NULL,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`
    INSERT INTO \`pages_blocks_hero_block_property_tabs_visible_tabs_new\` (\`id\`, \`order\`, \`parent_id\`, \`value\`)
    SELECT rowid, \`order\`, \`parent_id\`, \`value\`
    FROM \`pages_blocks_hero_block_property_tabs_visible_tabs\`
  `)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_block_property_tabs_visible_tabs\`;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block_property_tabs_visible_tabs_new\` RENAME TO \`pages_blocks_hero_block_property_tabs_visible_tabs\`;`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs_order_idx\` ON \`pages_blocks_hero_block_property_tabs_visible_tabs\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs_parent_idx\` ON \`pages_blocks_hero_block_property_tabs_visible_tabs\` (\`parent_id\`);`,
  )

  if (!(await tableExists(db, versionTableName))) return
  if (await tableHasColumn(db, versionTableName, 'id')) return

  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_new\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer NOT NULL,
    \`parent_id\` integer NOT NULL,
    \`value\` text NOT NULL,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`
    INSERT INTO \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_new\` (\`id\`, \`order\`, \`parent_id\`, \`value\`)
    SELECT rowid, \`order\`, \`parent_id\`, \`value\`
    FROM \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\`
  `)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_new\` RENAME TO \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\`;`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_order_idx\` ON \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_parent_idx\` ON \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\` (\`parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const tableName = 'pages_blocks_hero_block_property_tabs_visible_tabs'
  const versionTableName = '_pages_v_blocks_hero_block_property_tabs_visible_tabs'

  if (!(await tableExists(db, tableName))) return
  if (!(await tableHasColumn(db, tableName, 'id'))) return

  await db.run(sql`CREATE TABLE \`pages_blocks_hero_block_property_tabs_visible_tabs_new\` (
    \`order\` integer NOT NULL,
    \`parent_id\` text NOT NULL,
    \`value\` text NOT NULL,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`
    INSERT INTO \`pages_blocks_hero_block_property_tabs_visible_tabs_new\` (\`order\`, \`parent_id\`, \`value\`)
    SELECT \`order\`, \`parent_id\`, \`value\`
    FROM \`pages_blocks_hero_block_property_tabs_visible_tabs\`
  `)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_block_property_tabs_visible_tabs\`;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_block_property_tabs_visible_tabs_new\` RENAME TO \`pages_blocks_hero_block_property_tabs_visible_tabs\`;`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs_order_idx\` ON \`pages_blocks_hero_block_property_tabs_visible_tabs\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs_parent_idx\` ON \`pages_blocks_hero_block_property_tabs_visible_tabs\` (\`parent_id\`);`,
  )

  if (!(await tableExists(db, versionTableName))) return
  if (!(await tableHasColumn(db, versionTableName, 'id'))) return

  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_new\` (
    \`order\` integer NOT NULL,
    \`parent_id\` integer NOT NULL,
    \`value\` text NOT NULL,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`
    INSERT INTO \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_new\` (\`order\`, \`parent_id\`, \`value\`)
    SELECT \`order\`, \`parent_id\`, \`value\`
    FROM \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\`
  `)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_new\` RENAME TO \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\`;`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_order_idx\` ON \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_parent_idx\` ON \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\` (\`parent_id\`);`,
  )
}
