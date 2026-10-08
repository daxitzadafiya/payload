import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function tableExists(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql.raw(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.replace(/'/g, "''")}'`,
    ),
  )
  return rows.length > 0
}

async function tableHasColumn(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (!(await tableExists(db, table))) return
  if (await tableHasColumn(db, table, column)) return
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
}

async function dropColumnIfExists(
  db: MigrateDownArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  if (!(await tableExists(db, table))) return
  if (!(await tableHasColumn(db, table, column))) return
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // SQLite version may not support DROP COLUMN.
  }
}

/**
 * PropertyListBlock: crmQueryJson for Custom CRM Query.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of [
    'pages_blocks_property_list_block',
    '_pages_v_blocks_property_list_block',
  ] as const) {
    await addColumnIfMissing(db, table, 'crm_query_json', 'text')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [
    'pages_blocks_property_list_block',
    '_pages_v_blocks_property_list_block',
  ] as const) {
    await dropColumnIfExists(db, table, 'crm_query_json')
  }
}
