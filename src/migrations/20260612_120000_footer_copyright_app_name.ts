import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`footer\` ADD \`copyright_text\` text DEFAULT '© {year} {appName}. ALL RIGHTS RESERVED.';`,
  )

  await db.run(sql`
    UPDATE \`footer\`
    SET \`copyright_text\` = COALESCE(
      (
        SELECT REPLACE(\`copyright_text\`, 'HORIZON ESTATES', '{appName}')
        FROM \`footer_locales\`
        WHERE \`footer_locales\`.\`_parent_id\` = \`footer\`.\`id\`
        LIMIT 1
      ),
      '© {year} {appName}. ALL RIGHTS RESERVED.'
    );
  `)

  await db.run(sql`ALTER TABLE \`footer_locales\` DROP COLUMN \`copyright_text\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`footer_locales\` ADD \`copyright_text\` text DEFAULT '© {year} HORIZON ESTATES. ALL RIGHTS RESERVED.';`,
  )

  await db.run(sql`
    UPDATE \`footer_locales\`
    SET \`copyright_text\` = REPLACE(
      (
        SELECT \`copyright_text\`
        FROM \`footer\`
        WHERE \`footer\`.\`id\` = \`footer_locales\`.\`_parent_id\`
      ),
      '{appName}',
      'HORIZON ESTATES'
    );
  `)

  await db.run(sql`ALTER TABLE \`footer\` DROP COLUMN \`copyright_text\`;`)
}
