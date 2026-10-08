import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Hero buttons become one array. The first row is the primary button.
 * Existing primary, secondary, short-term, and long-term links are copied in that order.
 */

const LIVE_BLOCK = 'pages_blocks_hero_block'
const LIVE_LOCALES = 'pages_blocks_hero_block_locales'
const LIVE_BUTTONS = 'pages_blocks_hero_block_buttons'
const LIVE_BUTTON_LOCALES = 'pages_blocks_hero_block_buttons_locales'
const LIVE_RELS = 'pages_rels'
const LIVE_STAGING = '_hero_btn_migrate_live'

const VERSION_BLOCK = '_pages_v_blocks_hero_block'
const VERSION_LOCALES = '_pages_v_blocks_hero_block_locales'
const VERSION_BUTTONS = '_pages_v_blocks_hero_block_buttons'
const VERSION_BUTTON_LOCALES = '_pages_v_blocks_hero_block_buttons_locales'
const VERSION_RELS = '_pages_v_rels'
const VERSION_STAGING = '_hero_btn_migrate_ver'

const BLOCK_LINK_COLUMNS = [
  'cta_link_type',
  'cta_link_new_tab',
  'secondary_cta_link_type',
  'secondary_cta_link_new_tab',
  'short_term_cta_link_type',
  'short_term_cta_link_new_tab',
  'long_term_cta_link_type',
  'long_term_cta_link_new_tab',
] as const

const LOCALE_LINK_COLUMNS = [
  'button_text',
  'cta_link_url',
  'cta_link_label',
  'secondary_button_text',
  'secondary_cta_link_url',
  'short_term_button_text',
  'short_term_cta_link_url',
  'long_term_button_text',
  'long_term_cta_link_url',
] as const

const RESTORED_SLOTS = [
  { order: 1, rel: 'ctaLink', type: 'cta_link_type', newTab: 'cta_link_new_tab', text: 'button_text', url: 'cta_link_url' },
  {
    order: 2,
    rel: 'secondaryCtaLink',
    type: 'secondary_cta_link_type',
    newTab: 'secondary_cta_link_new_tab',
    text: 'secondary_button_text',
    url: 'secondary_cta_link_url',
  },
  {
    order: 3,
    rel: 'shortTermCtaLink',
    type: 'short_term_cta_link_type',
    newTab: 'short_term_cta_link_new_tab',
    text: 'short_term_button_text',
    url: 'short_term_cta_link_url',
  },
  {
    order: 4,
    rel: 'longTermCtaLink',
    type: 'long_term_cta_link_type',
    newTab: 'long_term_cta_link_new_tab',
    text: 'long_term_button_text',
    url: 'long_term_cta_link_url',
  },
] as const

function slotSelect(relsTable: string): string {
  const slots = [
    {
      index: 0,
      type: 'cta_link_type',
      newTab: 'cta_link_new_tab',
      rel: 'ctaLink',
      text: 'button_text',
      url: 'cta_link_url',
    },
    {
      index: 1,
      type: 'secondary_cta_link_type',
      newTab: 'secondary_cta_link_new_tab',
      rel: 'secondaryCtaLink',
      text: 'secondary_button_text',
      url: 'secondary_cta_link_url',
    },
    {
      index: 2,
      type: 'short_term_cta_link_type',
      newTab: 'short_term_cta_link_new_tab',
      rel: 'shortTermCtaLink',
      text: 'short_term_button_text',
      url: 'short_term_cta_link_url',
    },
    {
      index: 3,
      type: 'long_term_cta_link_type',
      newTab: 'long_term_cta_link_new_tab',
      rel: 'longTermCtaLink',
      text: 'long_term_button_text',
      url: 'long_term_cta_link_url',
    },
  ]

  return slots
    .map(
      (slot) => `
        SELECT
          h.id AS hero_id,
          h._parent_id AS page_id,
          h._path AS block_path,
          h._order AS block_order,
          ${slot.index} AS slot_index,
          h.${slot.type} AS link_type,
          h.${slot.newTab} AS link_new_tab,
          '${slot.rel}' AS rel_suffix
        FROM ${relsTable === LIVE_RELS ? LIVE_BLOCK : VERSION_BLOCK} h
        WHERE EXISTS (
          SELECT 1 FROM ${relsTable === LIVE_RELS ? LIVE_LOCALES : VERSION_LOCALES} l
          WHERE l._parent_id = h.id
            AND (
              trim(coalesce(l.${slot.text}, '')) != ''
              OR trim(coalesce(l.${slot.url}, '')) != ''
            )
        )
        OR EXISTS (
          SELECT 1 FROM ${relsTable} r
          WHERE r.parent_id = h._parent_id
            AND r.path = h._path || '.' || (h._order - 1) || '.${slot.rel}.reference'
        )`,
    )
    .join('\nUNION ALL\n')
}

async function createButtonTables(
  db: MigrateUpArgs['db'],
  options: {
    buttons: string
    locales: string
    parentTable: string
    parentIdType: 'text' | 'integer'
    idType: 'text' | 'integer'
    withUuid: boolean
  },
): Promise<void> {
  const idColumn = options.idType === 'text' ? '`id` text PRIMARY KEY NOT NULL' : '`id` integer PRIMARY KEY NOT NULL'
  const uuidColumn = options.withUuid ? '`_uuid` text,' : ''

  await db.run(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS \`${options.buttons}\` (
        \`_order\` integer NOT NULL,
        \`_parent_id\` ${options.parentIdType} NOT NULL,
        ${idColumn},
        ${uuidColumn}
        \`link_type\` text DEFAULT 'reference',
        \`link_new_tab\` integer,
        FOREIGN KEY (\`_parent_id\`) REFERENCES \`${options.parentTable}\`(\`id\`) ON UPDATE no action ON DELETE cascade
      );
    `),
  )
  await db.run(
    sql.raw(
      `CREATE INDEX IF NOT EXISTS \`${options.buttons}_order_idx\` ON \`${options.buttons}\` (\`_order\`);`,
    ),
  )
  await db.run(
    sql.raw(
      `CREATE INDEX IF NOT EXISTS \`${options.buttons}_parent_id_idx\` ON \`${options.buttons}\` (\`_parent_id\`);`,
    ),
  )

  await db.run(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS \`${options.locales}\` (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`_locale\` text NOT NULL,
        \`_parent_id\` ${options.idType} NOT NULL,
        \`label\` text,
        \`link_url\` text,
        FOREIGN KEY (\`_parent_id\`) REFERENCES \`${options.buttons}\`(\`id\`) ON UPDATE no action ON DELETE cascade
      );
    `),
  )
  await db.run(
    sql.raw(
      `CREATE UNIQUE INDEX IF NOT EXISTS \`${options.locales}_locale_parent_id_unique\` ON \`${options.locales}\` (\`_locale\`, \`_parent_id\`);`,
    ),
  )
}

async function copyButtons(
  db: MigrateUpArgs['db'],
  options: {
    staging: string
    block: string
    locales: string
    buttons: string
    buttonLocales: string
    rels: string
    withUuid: boolean
  },
): Promise<void> {
  await db.run(sql.raw(`DROP TABLE IF EXISTS \`${options.staging}\`;`))
  await db.run(
    sql.raw(`
      CREATE TABLE \`${options.staging}\` AS
      SELECT
        slots.*,
        ROW_NUMBER() OVER (PARTITION BY slots.hero_id ORDER BY slots.slot_index) AS button_order
      FROM (
        ${slotSelect(options.rels)}
      ) AS slots;
    `),
  )

  const idSelect = options.withUuid ? '' : 'lower(hex(randomblob(12))),'
  const idColumn = options.withUuid ? '' : '`id`,'
  const uuidColumn = options.withUuid ? '`_uuid`,' : ''
  const uuidSelect = options.withUuid ? 'lower(hex(randomblob(12))),' : ''

  await db.run(
    sql.raw(`
      INSERT INTO \`${options.buttons}\` (\`_order\`, \`_parent_id\`, ${idColumn} ${uuidColumn} \`link_type\`, \`link_new_tab\`)
      SELECT
        s.button_order,
        s.hero_id,
        ${idSelect}
        ${uuidSelect}
        COALESCE(NULLIF(s.link_type, ''), 'reference'),
        s.link_new_tab
      FROM \`${options.staging}\` s
      WHERE NOT EXISTS (
        SELECT 1 FROM \`${options.buttons}\` existing WHERE existing._parent_id = s.hero_id
      );
    `),
  )

  await db.run(
    sql.raw(`
      INSERT INTO \`${options.buttonLocales}\` (\`_locale\`, \`_parent_id\`, \`label\`, \`link_url\`)
      SELECT
        l._locale,
        b.id,
        CASE s.slot_index
          WHEN 0 THEN l.button_text
          WHEN 1 THEN l.secondary_button_text
          WHEN 2 THEN l.short_term_button_text
          ELSE l.long_term_button_text
        END,
        CASE s.slot_index
          WHEN 0 THEN l.cta_link_url
          WHEN 1 THEN l.secondary_cta_link_url
          WHEN 2 THEN l.short_term_cta_link_url
          ELSE l.long_term_cta_link_url
        END
      FROM \`${options.staging}\` s
      JOIN \`${options.buttons}\` b
        ON b._parent_id = s.hero_id AND b._order = s.button_order
      JOIN \`${options.locales}\` l
        ON l._parent_id = s.hero_id
      WHERE NOT EXISTS (
        SELECT 1 FROM \`${options.buttonLocales}\` existing
        WHERE existing._parent_id = b.id AND existing._locale = l._locale
      );
    `),
  )

  await db.run(
    sql.raw(`
      UPDATE \`${options.rels}\`
      SET path = s.block_path || '.' || (s.block_order - 1) || '.buttons.' || (s.button_order - 1) || '.link.reference'
      FROM \`${options.staging}\` AS s
      WHERE \`${options.rels}\`.parent_id = s.page_id
        AND \`${options.rels}\`.path = s.block_path || '.' || (s.block_order - 1) || '.' || s.rel_suffix || '.reference';
    `),
  )

  await db.run(sql.raw(`DROP TABLE IF EXISTS \`${options.staging}\`;`))
}

async function dropColumnIfExists(
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column missing or this SQLite build cannot drop it.
  }
}

async function addColumnIfMissing(
  db: MigrateUpArgs['db'] | MigrateDownArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition}`))
  } catch {
    // Column already exists.
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await createButtonTables(db, {
    buttons: LIVE_BUTTONS,
    locales: LIVE_BUTTON_LOCALES,
    parentTable: LIVE_BLOCK,
    parentIdType: 'text',
    idType: 'text',
    withUuid: false,
  })
  await createButtonTables(db, {
    buttons: VERSION_BUTTONS,
    locales: VERSION_BUTTON_LOCALES,
    parentTable: VERSION_BLOCK,
    parentIdType: 'integer',
    idType: 'integer',
    withUuid: true,
  })

  await copyButtons(db, {
    staging: LIVE_STAGING,
    block: LIVE_BLOCK,
    locales: LIVE_LOCALES,
    buttons: LIVE_BUTTONS,
    buttonLocales: LIVE_BUTTON_LOCALES,
    rels: LIVE_RELS,
    withUuid: false,
  })
  await copyButtons(db, {
    staging: VERSION_STAGING,
    block: VERSION_BLOCK,
    locales: VERSION_LOCALES,
    buttons: VERSION_BUTTONS,
    buttonLocales: VERSION_BUTTON_LOCALES,
    rels: VERSION_RELS,
    withUuid: true,
  })

  for (const table of [LIVE_BLOCK, VERSION_BLOCK]) {
    for (const column of BLOCK_LINK_COLUMNS) {
      await dropColumnIfExists(db, table, column)
    }
  }
  for (const table of [LIVE_LOCALES, VERSION_LOCALES]) {
    for (const column of LOCALE_LINK_COLUMNS) {
      await dropColumnIfExists(db, table, column)
    }
  }
}

async function restoreButtons(
  db: MigrateDownArgs['db'],
  options: {
    block: string
    locales: string
    buttons: string
    buttonLocales: string
    rels: string
  },
): Promise<void> {
  for (const slot of RESTORED_SLOTS) {
    await db.run(
      sql.raw(`
        UPDATE \`${options.block}\`
        SET \`${slot.type}\` = (
          SELECT b.link_type FROM \`${options.buttons}\` b
          WHERE b._parent_id = \`${options.block}\`.id AND b._order = ${slot.order}
        ),
        \`${slot.newTab}\` = (
          SELECT b.link_new_tab FROM \`${options.buttons}\` b
          WHERE b._parent_id = \`${options.block}\`.id AND b._order = ${slot.order}
        )
        WHERE EXISTS (
          SELECT 1 FROM \`${options.buttons}\` b
          WHERE b._parent_id = \`${options.block}\`.id AND b._order = ${slot.order}
        );
      `),
    )
    await db.run(
      sql.raw(`
        UPDATE \`${options.locales}\`
        SET \`${slot.text}\` = (
          SELECT loc.label
          FROM \`${options.buttons}\` b
          JOIN \`${options.buttonLocales}\` loc
            ON loc._parent_id = b.id AND loc._locale = \`${options.locales}\`._locale
          WHERE b._parent_id = \`${options.locales}\`._parent_id AND b._order = ${slot.order}
        ),
        \`${slot.url}\` = (
          SELECT loc.link_url
          FROM \`${options.buttons}\` b
          JOIN \`${options.buttonLocales}\` loc
            ON loc._parent_id = b.id AND loc._locale = \`${options.locales}\`._locale
          WHERE b._parent_id = \`${options.locales}\`._parent_id AND b._order = ${slot.order}
        )
        WHERE EXISTS (
          SELECT 1 FROM \`${options.buttons}\` b
          WHERE b._parent_id = \`${options.locales}\`._parent_id AND b._order = ${slot.order}
        );
      `),
    )
    await db.run(
      sql.raw(`
        UPDATE \`${options.rels}\`
        SET path = block._path || '.' || (block._order - 1) || '.${slot.rel}.reference'
        FROM \`${options.block}\` AS block
        WHERE \`${options.rels}\`.parent_id = block._parent_id
          AND \`${options.rels}\`.path = block._path || '.' || (block._order - 1) || '.buttons.${slot.order - 1}.link.reference';
      `),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [LIVE_BLOCK, VERSION_BLOCK]) {
    await addColumnIfMissing(db, table, 'cta_link_type', `text DEFAULT 'reference'`)
    await addColumnIfMissing(db, table, 'cta_link_new_tab', 'integer')
    await addColumnIfMissing(db, table, 'secondary_cta_link_type', 'text')
    await addColumnIfMissing(db, table, 'secondary_cta_link_new_tab', 'integer')
    await addColumnIfMissing(db, table, 'short_term_cta_link_type', 'text')
    await addColumnIfMissing(db, table, 'short_term_cta_link_new_tab', 'integer')
    await addColumnIfMissing(db, table, 'long_term_cta_link_type', 'text')
    await addColumnIfMissing(db, table, 'long_term_cta_link_new_tab', 'integer')
  }
  for (const table of [LIVE_LOCALES, VERSION_LOCALES]) {
    await addColumnIfMissing(db, table, 'button_text', `text DEFAULT 'View All Properties'`)
    await addColumnIfMissing(db, table, 'cta_link_url', 'text')
    await addColumnIfMissing(db, table, 'cta_link_label', 'text')
    await addColumnIfMissing(db, table, 'secondary_button_text', 'text')
    await addColumnIfMissing(db, table, 'secondary_cta_link_url', 'text')
    await addColumnIfMissing(db, table, 'short_term_button_text', 'text')
    await addColumnIfMissing(db, table, 'short_term_cta_link_url', 'text')
    await addColumnIfMissing(db, table, 'long_term_button_text', 'text')
    await addColumnIfMissing(db, table, 'long_term_cta_link_url', 'text')
  }

  await restoreButtons(db, {
    block: LIVE_BLOCK,
    locales: LIVE_LOCALES,
    buttons: LIVE_BUTTONS,
    buttonLocales: LIVE_BUTTON_LOCALES,
    rels: LIVE_RELS,
  })
  await restoreButtons(db, {
    block: VERSION_BLOCK,
    locales: VERSION_LOCALES,
    buttons: VERSION_BUTTONS,
    buttonLocales: VERSION_BUTTON_LOCALES,
    rels: VERSION_RELS,
  })

  await db.run(sql.raw(`DROP TABLE IF EXISTS \`${VERSION_BUTTON_LOCALES}\`;`))
  await db.run(sql.raw(`DROP TABLE IF EXISTS \`${VERSION_BUTTONS}\`;`))
  await db.run(sql.raw(`DROP TABLE IF EXISTS \`${LIVE_BUTTON_LOCALES}\`;`))
  await db.run(sql.raw(`DROP TABLE IF EXISTS \`${LIVE_BUTTONS}\`;`))
}
