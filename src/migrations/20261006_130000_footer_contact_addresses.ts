import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function columnExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

async function dropColumnIfExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  if (!(await columnExists(db, table, column))) return
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column missing or this SQLite build cannot drop columns.
  }
}

/**
 * Footer contact: one localized address textarea becomes a shared list of
 * localized addresses. Existing per-locale text is copied onto the first row.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`footer_contact_addresses\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`footer_contact_addresses_order_idx\` ON \`footer_contact_addresses\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`footer_contact_addresses_parent_id_idx\` ON \`footer_contact_addresses\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`footer_contact_addresses_locales\` (
      \`address\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_contact_addresses\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`footer_contact_addresses_locales_locale_parent_id_unique\` ON \`footer_contact_addresses_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_footer_v_version_contact_addresses\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_footer_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_footer_v_version_contact_addresses_order_idx\` ON \`_footer_v_version_contact_addresses\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_footer_v_version_contact_addresses_parent_id_idx\` ON \`_footer_v_version_contact_addresses\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_footer_v_version_contact_addresses_locales\` (
      \`address\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_footer_v_version_contact_addresses\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_footer_v_version_contact_addresses_locales_locale_parent_id\` ON \`_footer_v_version_contact_addresses_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  if (await columnExists(db, 'footer_locales', 'contact_address')) {
    await db.run(sql`
      INSERT INTO \`footer_contact_addresses\` (\`_order\`, \`_parent_id\`, \`id\`)
      SELECT 1, \`footer\`.\`id\`, lower(hex(randomblob(12)))
      FROM \`footer\`
      WHERE EXISTS (
        SELECT 1
        FROM \`footer_locales\`
        WHERE \`footer_locales\`.\`_parent_id\` = \`footer\`.\`id\`
          AND \`footer_locales\`.\`contact_address\` IS NOT NULL
          AND TRIM(\`footer_locales\`.\`contact_address\`) != ''
      )
      AND NOT EXISTS (
        SELECT 1
        FROM \`footer_contact_addresses\`
        WHERE \`footer_contact_addresses\`.\`_parent_id\` = \`footer\`.\`id\`
      );
    `)

    await db.run(sql`
      INSERT INTO \`footer_contact_addresses_locales\` (\`address\`, \`_locale\`, \`_parent_id\`)
      SELECT \`footer_locales\`.\`contact_address\`, \`footer_locales\`.\`_locale\`, \`addresses\`.\`id\`
      FROM \`footer_locales\`
      INNER JOIN \`footer_contact_addresses\` AS \`addresses\`
        ON \`addresses\`.\`_parent_id\` = \`footer_locales\`.\`_parent_id\`
        AND \`addresses\`.\`_order\` = 1
      WHERE \`footer_locales\`.\`contact_address\` IS NOT NULL
        AND TRIM(\`footer_locales\`.\`contact_address\`) != ''
        AND NOT EXISTS (
          SELECT 1
          FROM \`footer_contact_addresses_locales\` AS \`locales\`
          WHERE \`locales\`.\`_parent_id\` = \`addresses\`.\`id\`
            AND \`locales\`.\`_locale\` = \`footer_locales\`.\`_locale\`
        );
    `)
  }

  if (await columnExists(db, '_footer_v_locales', 'version_contact_address')) {
    await db.run(sql`
      INSERT INTO \`_footer_v_version_contact_addresses\` (\`_order\`, \`_parent_id\`, \`_uuid\`)
      SELECT 1, \`_footer_v\`.\`id\`, lower(hex(randomblob(12)))
      FROM \`_footer_v\`
      WHERE EXISTS (
        SELECT 1
        FROM \`_footer_v_locales\`
        WHERE \`_footer_v_locales\`.\`_parent_id\` = \`_footer_v\`.\`id\`
          AND \`_footer_v_locales\`.\`version_contact_address\` IS NOT NULL
          AND TRIM(\`_footer_v_locales\`.\`version_contact_address\`) != ''
      )
      AND NOT EXISTS (
        SELECT 1
        FROM \`_footer_v_version_contact_addresses\`
        WHERE \`_footer_v_version_contact_addresses\`.\`_parent_id\` = \`_footer_v\`.\`id\`
      );
    `)

    await db.run(sql`
      INSERT INTO \`_footer_v_version_contact_addresses_locales\` (\`address\`, \`_locale\`, \`_parent_id\`)
      SELECT \`_footer_v_locales\`.\`version_contact_address\`, \`_footer_v_locales\`.\`_locale\`, \`addresses\`.\`id\`
      FROM \`_footer_v_locales\`
      INNER JOIN \`_footer_v_version_contact_addresses\` AS \`addresses\`
        ON \`addresses\`.\`_parent_id\` = \`_footer_v_locales\`.\`_parent_id\`
        AND \`addresses\`.\`_order\` = 1
      WHERE \`_footer_v_locales\`.\`version_contact_address\` IS NOT NULL
        AND TRIM(\`_footer_v_locales\`.\`version_contact_address\`) != ''
        AND NOT EXISTS (
          SELECT 1
          FROM \`_footer_v_version_contact_addresses_locales\` AS \`locales\`
          WHERE \`locales\`.\`_parent_id\` = \`addresses\`.\`id\`
            AND \`locales\`.\`_locale\` = \`_footer_v_locales\`.\`_locale\`
        );
    `)
  }

  await dropColumnIfExists(db, 'footer_locales', 'contact_address')
  await dropColumnIfExists(db, '_footer_v_locales', 'version_contact_address')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await columnExists(db, 'footer_locales', 'contact_address'))) {
    await db.run(
      sql`ALTER TABLE \`footer_locales\` ADD \`contact_address\` text DEFAULT 'Skoufa 12, Athens';`,
    )
  }

  await db.run(sql`
    UPDATE \`footer_locales\`
    SET \`contact_address\` = (
      SELECT \`locales\`.\`address\`
      FROM \`footer_contact_addresses_locales\` AS \`locales\`
      INNER JOIN \`footer_contact_addresses\` AS \`addresses\`
        ON \`addresses\`.\`id\` = \`locales\`.\`_parent_id\`
      WHERE \`addresses\`.\`_parent_id\` = \`footer_locales\`.\`_parent_id\`
        AND \`locales\`.\`_locale\` = \`footer_locales\`.\`_locale\`
      ORDER BY \`addresses\`.\`_order\` ASC
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1
      FROM \`footer_contact_addresses_locales\` AS \`locales\`
      INNER JOIN \`footer_contact_addresses\` AS \`addresses\`
        ON \`addresses\`.\`id\` = \`locales\`.\`_parent_id\`
      WHERE \`addresses\`.\`_parent_id\` = \`footer_locales\`.\`_parent_id\`
        AND \`locales\`.\`_locale\` = \`footer_locales\`.\`_locale\`
    );
  `)

  if (!(await columnExists(db, '_footer_v_locales', 'version_contact_address'))) {
    await db.run(
      sql`ALTER TABLE \`_footer_v_locales\` ADD \`version_contact_address\` text DEFAULT 'Skoufa 12, Athens';`,
    )
  }

  await db.run(sql`
    UPDATE \`_footer_v_locales\`
    SET \`version_contact_address\` = (
      SELECT \`locales\`.\`address\`
      FROM \`_footer_v_version_contact_addresses_locales\` AS \`locales\`
      INNER JOIN \`_footer_v_version_contact_addresses\` AS \`addresses\`
        ON \`addresses\`.\`id\` = \`locales\`.\`_parent_id\`
      WHERE \`addresses\`.\`_parent_id\` = \`_footer_v_locales\`.\`_parent_id\`
        AND \`locales\`.\`_locale\` = \`_footer_v_locales\`.\`_locale\`
      ORDER BY \`addresses\`.\`_order\` ASC
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1
      FROM \`_footer_v_version_contact_addresses_locales\` AS \`locales\`
      INNER JOIN \`_footer_v_version_contact_addresses\` AS \`addresses\`
        ON \`addresses\`.\`id\` = \`locales\`.\`_parent_id\`
      WHERE \`addresses\`.\`_parent_id\` = \`_footer_v_locales\`.\`_parent_id\`
        AND \`locales\`.\`_locale\` = \`_footer_v_locales\`.\`_locale\`
    );
  `)

  await db.run(sql`DROP TABLE IF EXISTS \`_footer_v_version_contact_addresses_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_footer_v_version_contact_addresses\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_contact_addresses_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_contact_addresses\`;`)
}
