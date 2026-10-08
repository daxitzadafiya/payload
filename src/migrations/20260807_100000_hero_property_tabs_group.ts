import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

const ALL_PROPERTY_TABS = ['sale', 'rental', 'holiday'] as const

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
  } catch {
    // Already present.
  }
}

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

type HeroBlockRow = {
  id: string
  default_property_tab?: string | null
  show_sale_tab?: number | null
  show_rental_tab?: number | null
  show_holiday_tab?: number | null
}

type VersionHeroBlockRow = {
  id: number
  default_property_tab?: string | null
  show_sale_tab?: number | null
  show_rental_tab?: number | null
  show_holiday_tab?: number | null
}

const resolveVisibleTabs = (row: HeroBlockRow | VersionHeroBlockRow): string[] => {
  const hasLegacyShowColumns =
    row.show_sale_tab !== undefined ||
    row.show_rental_tab !== undefined ||
    row.show_holiday_tab !== undefined

  if (hasLegacyShowColumns) {
    const tabs: string[] = []
    if (row.show_sale_tab !== 0) tabs.push('sale')
    if (row.show_rental_tab !== 0) tabs.push('rental')
    if (row.show_holiday_tab !== 0) tabs.push('holiday')
    if (tabs.length) return tabs
  }

  return [...ALL_PROPERTY_TABS]
}

async function migrateHeroBlockRows({
  db,
  heroTable,
  visibleTabsTable,
}: {
  db: MigrateUpArgs['db']
  heroTable: string
  visibleTabsTable: string
}): Promise<void> {
  const hasDefaultPropertyTab = await tableHasColumn(db, heroTable, 'default_property_tab')
  const hasShowSaleTab = await tableHasColumn(db, heroTable, 'show_sale_tab')
  const hasShowRentalTab = await tableHasColumn(db, heroTable, 'show_rental_tab')
  const hasShowHolidayTab = await tableHasColumn(db, heroTable, 'show_holiday_tab')

  const selectColumns = ['id']
  if (hasDefaultPropertyTab) selectColumns.push('default_property_tab')
  if (hasShowSaleTab) selectColumns.push('show_sale_tab')
  if (hasShowRentalTab) selectColumns.push('show_rental_tab')
  if (hasShowHolidayTab) selectColumns.push('show_holiday_tab')

  const heroBlocks = await db.all<HeroBlockRow | VersionHeroBlockRow>(
    sql.raw(`SELECT ${selectColumns.join(', ')} FROM \`${heroTable}\``),
  )

  for (const block of heroBlocks) {
    const defaultTab = block.default_property_tab ?? 'sale'
    await db.run(
      sql.raw(
        `UPDATE \`${heroTable}\` SET property_tabs_default_tab = '${defaultTab}' WHERE id = '${block.id}'`,
      ),
    )

    const existingTabs = await db.all<{ count: number }>(
      sql.raw(
        `SELECT COUNT(*) as count FROM \`${visibleTabsTable}\` WHERE parent_id = '${block.id}'`,
      ),
    )
    if ((existingTabs[0]?.count ?? 0) > 0) continue

    const visibleTabs = resolveVisibleTabs(block)
    for (let index = 0; index < visibleTabs.length; index += 1) {
      await db.run(sql`
        INSERT INTO ${sql.raw(`\`${visibleTabsTable}\``)} (\"order\", parent_id, value)
        VALUES (${index}, ${block.id}, ${visibleTabs[index]})
      `)
    }
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'pages_blocks_hero_block', 'property_tabs_default_tab', "text DEFAULT 'sale'")
  await addColumnIfMissing(
    db,
    '_pages_v_blocks_hero_block',
    'property_tabs_default_tab',
    "text DEFAULT 'sale'",
  )

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer NOT NULL,
    \`parent_id\` text NOT NULL,
    \`value\` text NOT NULL,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs_order_idx\` ON \`pages_blocks_hero_block_property_tabs_visible_tabs\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs_parent_idx\` ON \`pages_blocks_hero_block_property_tabs_visible_tabs\` (\`parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer NOT NULL,
    \`parent_id\` integer NOT NULL,
    \`value\` text NOT NULL,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_order_idx\` ON \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs_parent_idx\` ON \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\` (\`parent_id\`);`,
  )

  await migrateHeroBlockRows({
    db,
    heroTable: 'pages_blocks_hero_block',
    visibleTabsTable: 'pages_blocks_hero_block_property_tabs_visible_tabs',
  })
  await migrateHeroBlockRows({
    db,
    heroTable: '_pages_v_blocks_hero_block',
    visibleTabsTable: '_pages_v_blocks_hero_block_property_tabs_visible_tabs',
  })

  if (await tableHasColumn(db, 'pages_blocks_hero_block', 'default_property_tab')) {
    try {
      await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`default_property_tab\`;`)
    } catch {
      // Column may already be removed.
    }
  }
  for (const column of ['show_sale_tab', 'show_rental_tab', 'show_holiday_tab'] as const) {
    if (await tableHasColumn(db, 'pages_blocks_hero_block', column)) {
      try {
        await db.run(sql.raw(`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`${column}\`;`))
      } catch {
        // Column may already be removed.
      }
    }
  }

  if (await tableHasColumn(db, '_pages_v_blocks_hero_block', 'default_property_tab')) {
    try {
      await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`default_property_tab\`;`)
    } catch {
      // Column may already be removed.
    }
  }
  for (const column of ['show_sale_tab', 'show_rental_tab', 'show_holiday_tab'] as const) {
    if (await tableHasColumn(db, '_pages_v_blocks_hero_block', column)) {
      try {
        await db.run(sql.raw(`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`${column}\`;`))
      } catch {
        // Column may already be removed.
      }
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await addColumnIfMissing(db, 'pages_blocks_hero_block', 'default_property_tab', "text DEFAULT 'sale'")
  await addColumnIfMissing(
    db,
    '_pages_v_blocks_hero_block',
    'default_property_tab',
    "text DEFAULT 'sale'",
  )

  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_hero_block_property_tabs_visible_tabs\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_hero_block_property_tabs_visible_tabs\`;`)

  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`property_tabs_default_tab\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`property_tabs_default_tab\`;`)
}
