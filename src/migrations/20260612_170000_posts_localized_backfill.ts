import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Copy existing post copy from the main `posts` table into `posts_locales`
 * after localized fields were added (fixes empty titles on listing pages).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    UPDATE \`posts_locales\`
    SET
      \`title\` = COALESCE(\`title\`, (SELECT \`title\` FROM \`posts\` WHERE \`posts\`.\`id\` = \`posts_locales\`.\`_parent_id\`)),
      \`subtitle\` = COALESCE(\`subtitle\`, (SELECT \`subtitle\` FROM \`posts\` WHERE \`posts\`.\`id\` = \`posts_locales\`.\`_parent_id\`)),
      \`content\` = COALESCE(\`content\`, (SELECT \`content\` FROM \`posts\` WHERE \`posts\`.\`id\` = \`posts_locales\`.\`_parent_id\`))
  `)

  await db.run(sql`
    INSERT INTO \`posts_locales\` (\`_parent_id\`, \`_locale\`, \`title\`, \`subtitle\`, \`content\`)
    SELECT \`posts\`.\`id\`, 'en', \`posts\`.\`title\`, \`posts\`.\`subtitle\`, \`posts\`.\`content\`
    FROM \`posts\`
    WHERE NOT EXISTS (
      SELECT 1
      FROM \`posts_locales\`
      WHERE \`posts_locales\`.\`_parent_id\` = \`posts\`.\`id\`
        AND \`posts_locales\`.\`_locale\` = 'en'
    )
  `)
}

export async function down(): Promise<void> {
  // Data backfill — no schema rollback.
}
