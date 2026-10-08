import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Move Localization "Display name" (`label`) into a locales table so it can
 * be translated per content locale (same pattern as property filter labels).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`localization_languages_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`localization_languages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`localization_languages_locales_locale_parent_id_unique\` ON \`localization_languages_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  // Backfill English (and any existing site locales later via DeepL) from the previous non-localized column.
  await db.run(sql`
    INSERT INTO \`localization_languages_locales\` (\`label\`, \`_locale\`, \`_parent_id\`)
    SELECT \`label\`, 'en', \`id\`
    FROM \`localization_languages\`
    WHERE \`label\` IS NOT NULL
      AND TRIM(\`label\`) != ''
      AND NOT EXISTS (
        SELECT 1
        FROM \`localization_languages_locales\` AS locales
        WHERE locales.\`_parent_id\` = \`localization_languages\`.\`id\`
          AND locales.\`_locale\` = 'en'
      );
  `)

  await db.run(sql`ALTER TABLE \`localization_languages\` DROP COLUMN \`label\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`localization_languages\` ADD \`label\` text;`)

  await db.run(sql`
    UPDATE \`localization_languages\`
    SET \`label\` = (
      SELECT locales.\`label\`
      FROM \`localization_languages_locales\` AS locales
      WHERE locales.\`_parent_id\` = \`localization_languages\`.\`id\`
        AND locales.\`_locale\` = 'en'
      LIMIT 1
    );
  `)

  await db.run(sql`DROP TABLE IF EXISTS \`localization_languages_locales\`;`)
}
