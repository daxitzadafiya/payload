import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Sell / Rent pages open the owner form. The CTA link field is no longer used.
 */

async function tableExists(
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
  table: string,
): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql.raw(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.replace(/'/g, "''")}'`,
    ),
  )
  return rows.length > 0
}

async function tableHasColumn(
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  if (!(await tableExists(db, table))) return false
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

async function addColumnIfMissing(
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (!(await tableExists(db, table))) return
  if (await tableHasColumn(db, table, column)) return
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
}

async function dropColumnIfExists(
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  if (!(await tableHasColumn(db, table, column))) return
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // SQLite version may not support DROP COLUMN.
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (await tableExists(db, 'pages_rels')) {
    await db.run(sql`
      DELETE FROM \`pages_rels\`
      WHERE EXISTS (
        SELECT 1 FROM \`sell_prop\` AS block
        WHERE block.\`_parent_id\` = \`pages_rels\`.\`parent_id\`
          AND \`pages_rels\`.\`path\` = block.\`_path\` || '.' || (block.\`_order\` - 1) || '.ctaLink.reference'
      )
    `)
  }

  if (await tableExists(db, '_pages_v_rels')) {
    await db.run(sql`
      DELETE FROM \`_pages_v_rels\`
      WHERE EXISTS (
        SELECT 1 FROM \`_sell_prop_v\` AS block
        WHERE block.\`_parent_id\` = \`_pages_v_rels\`.\`parent_id\`
          AND \`_pages_v_rels\`.\`path\` = block.\`_path\` || '.' || (block.\`_order\` - 1) || '.ctaLink.reference'
      )
    `)
  }

  await dropColumnIfExists(db, 'sell_prop', 'cta_link_type')
  await dropColumnIfExists(db, 'sell_prop', 'cta_link_new_tab')
  await dropColumnIfExists(db, '_sell_prop_v', 'cta_link_type')
  await dropColumnIfExists(db, '_sell_prop_v', 'cta_link_new_tab')
  await dropColumnIfExists(db, 'sell_prop_locales', 'cta_link_url')
  await dropColumnIfExists(db, '_sell_prop_v_locales', 'cta_link_url')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await addColumnIfMissing(db, 'sell_prop', 'cta_link_type', `text DEFAULT 'reference'`)
  await addColumnIfMissing(db, 'sell_prop', 'cta_link_new_tab', 'integer DEFAULT false')
  await addColumnIfMissing(db, '_sell_prop_v', 'cta_link_type', `text DEFAULT 'reference'`)
  await addColumnIfMissing(db, '_sell_prop_v', 'cta_link_new_tab', 'integer DEFAULT false')
  await addColumnIfMissing(db, 'sell_prop_locales', 'cta_link_url', 'text')
  await addColumnIfMissing(db, '_sell_prop_v_locales', 'cta_link_url', 'text')
}
