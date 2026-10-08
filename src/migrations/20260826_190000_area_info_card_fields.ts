import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Area Info cards:
 * - more_label → description (short description under the title)
 * - drop more_href
 * - cta_href → ctaLink (page/custom link group)
 */

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
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
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

async function renameColumnIfNeeded(
  db: MigrateUpArgs['db'],
  table: string,
  from: string,
  to: string,
): Promise<void> {
  if (!(await tableExists(db, table))) return
  const hasTo = await tableHasColumn(db, table, to)
  const hasFrom = await tableHasColumn(db, table, from)
  if (hasTo) {
    if (hasFrom) await dropColumnIfExists(db, table, from)
    return
  }
  if (!hasFrom) {
    await addColumnIfMissing(db, table, to, 'text')
    return
  }
  await db.run(sql.raw(`ALTER TABLE \`${table}\` RENAME COLUMN \`${from}\` TO \`${to}\``))
}

async function migrateCardTable(
  db: MigrateUpArgs['db'],
  cardTable: string,
  localesTable: string,
): Promise<void> {
  if (!(await tableExists(db, cardTable))) return

  await addColumnIfMissing(db, cardTable, 'cta_link_type', `text DEFAULT 'reference'`)
  await addColumnIfMissing(db, cardTable, 'cta_link_new_tab', 'integer DEFAULT false')

  if (await tableExists(db, localesTable)) {
    await renameColumnIfNeeded(db, localesTable, 'more_label', 'description')
    await addColumnIfMissing(db, localesTable, 'cta_link_url', 'text')

    // Move plain CTA URLs into the link group as custom URLs.
    if (await tableHasColumn(db, cardTable, 'cta_href')) {
      await db.run(
        sql.raw(`
          UPDATE \`${localesTable}\`
          SET \`cta_link_url\` = (
            SELECT \`cta_href\` FROM \`${cardTable}\` AS cards
            WHERE cards.\`id\` = \`${localesTable}\`.\`_parent_id\`
          )
          WHERE (\`cta_link_url\` IS NULL OR \`cta_link_url\` = '')
            AND EXISTS (
              SELECT 1 FROM \`${cardTable}\` AS cards
              WHERE cards.\`id\` = \`${localesTable}\`.\`_parent_id\`
                AND cards.\`cta_href\` IS NOT NULL
                AND cards.\`cta_href\` != ''
            )
        `),
      )
      await db.run(
        sql.raw(`
          UPDATE \`${cardTable}\`
          SET \`cta_link_type\` = 'custom'
          WHERE \`cta_href\` IS NOT NULL AND \`cta_href\` != ''
        `),
      )
    }
  }

  await dropColumnIfExists(db, cardTable, 'more_href')
  await dropColumnIfExists(db, cardTable, 'cta_href')
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await migrateCardTable(db, 'ai_card', 'ai_card_locales')
  await migrateCardTable(db, '_ai_card_v', '_ai_card_v_locales')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [cardTable, localesTable] of [
    ['ai_card', 'ai_card_locales'],
    ['_ai_card_v', '_ai_card_v_locales'],
  ] as const) {
    if (!(await tableExists(db, cardTable))) continue

    await addColumnIfMissing(db, cardTable, 'more_href', 'text')
    await addColumnIfMissing(db, cardTable, 'cta_href', `text DEFAULT '/property-for-sale'`)

    if (await tableExists(db, localesTable)) {
      await renameColumnIfNeeded(db, localesTable, 'description', 'more_label')

      if (await tableHasColumn(db, localesTable, 'cta_link_url')) {
        await db.run(
          sql.raw(`
            UPDATE \`${cardTable}\`
            SET \`cta_href\` = (
              SELECT \`cta_link_url\` FROM \`${localesTable}\` AS locales
              WHERE locales.\`_parent_id\` = \`${cardTable}\`.\`id\`
              ORDER BY CASE WHEN locales.\`_locale\` = 'en' THEN 0 ELSE 1 END
              LIMIT 1
            )
            WHERE (\`cta_href\` IS NULL OR \`cta_href\` = '')
          `),
        )
      }

      await dropColumnIfExists(db, localesTable, 'cta_link_url')
    }

    await dropColumnIfExists(db, cardTable, 'cta_link_type')
    await dropColumnIfExists(db, cardTable, 'cta_link_new_tab')
  }
}
