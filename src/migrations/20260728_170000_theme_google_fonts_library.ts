import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

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

/**
 * Theme fonts: replace fixed fontFamily select with fontMode + editable googleFonts array.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'theme', 'font_mode', "text DEFAULT 'site-default'")

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`theme_google_fonts\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`family\` text,
      \`active\` integer DEFAULT 0,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`theme\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)

  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`theme_google_fonts_order_idx\` ON \`theme_google_fonts\` (\`_order\`);`,
    )
  } catch {
    // ignore
  }

  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`theme_google_fonts_parent_id_idx\` ON \`theme_google_fonts\` (\`_parent_id\`);`,
    )
  } catch {
    // ignore
  }

  // Map legacy font_family select values → font_mode + googleFonts rows (when column exists).
  try {
    await db.run(sql`
      UPDATE \`theme\`
      SET \`font_mode\` = CASE
        WHEN \`font_family\` IS NULL OR \`font_family\` = '' OR \`font_family\` = 'site-default'
          THEN 'site-default'
        ELSE 'google'
      END
    `)

    await db.run(sql`
      INSERT INTO \`theme_google_fonts\` (\`_order\`, \`_parent_id\`, \`id\`, \`family\`, \`active\`)
      SELECT
        1,
        \`theme\`.\`id\`,
        'mig_' || \`theme\`.\`id\` || '_active',
        CASE \`theme\`.\`font_family\`
          WHEN 'outfit' THEN 'Outfit'
          WHEN 'eb-garamond' THEN 'EB Garamond'
          WHEN 'inter' THEN 'Inter'
          WHEN 'poppins' THEN 'Poppins'
          WHEN 'roboto' THEN 'Roboto'
          WHEN 'montserrat' THEN 'Montserrat'
          WHEN 'lora' THEN 'Lora'
          WHEN 'playfair-display' THEN 'Playfair Display'
          WHEN 'source-sans-3' THEN 'Source Sans 3'
          WHEN 'figtree' THEN 'Figtree'
          ELSE \`theme\`.\`font_family\`
        END,
        1
      FROM \`theme\`
      WHERE \`theme\`.\`font_family\` IS NOT NULL
        AND \`theme\`.\`font_family\` != ''
        AND \`theme\`.\`font_family\` != 'site-default'
        AND NOT EXISTS (
          SELECT 1 FROM \`theme_google_fonts\`
          WHERE \`theme_google_fonts\`.\`_parent_id\` = \`theme\`.\`id\`
        )
    `)

    // Always offer Figtree as an inactive option when migrating a non-Figtree custom font.
    await db.run(sql`
      INSERT INTO \`theme_google_fonts\` (\`_order\`, \`_parent_id\`, \`id\`, \`family\`, \`active\`)
      SELECT
        2,
        \`theme\`.\`id\`,
        'mig_' || \`theme\`.\`id\` || '_figtree',
        'Figtree',
        0
      FROM \`theme\`
      WHERE \`theme\`.\`font_mode\` = 'google'
        AND NOT EXISTS (
          SELECT 1 FROM \`theme_google_fonts\`
          WHERE \`theme_google_fonts\`.\`_parent_id\` = \`theme\`.\`id\`
            AND \`theme_google_fonts\`.\`family\` = 'Figtree'
        )
    `)
  } catch {
    // font_family may not exist on fresh DBs — ignore.
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  try {
    await db.run(sql`DROP TABLE IF EXISTS \`theme_google_fonts\`;`)
  } catch {
    // ignore
  }
  try {
    await db.run(sql.raw(`ALTER TABLE \`theme\` DROP COLUMN \`font_mode\``))
  } catch {
    // ignore
  }
}
