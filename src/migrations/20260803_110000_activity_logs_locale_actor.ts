import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`activity_logs\` ADD COLUMN \`locale\` text;`)
  await db.run(sql`ALTER TABLE \`activity_logs\` ADD COLUMN \`locale_label\` text;`)
  await db.run(sql`ALTER TABLE \`activity_logs\` ADD COLUMN \`actor_label\` text;`)
  await db.run(sql`ALTER TABLE \`activity_logs\` ADD COLUMN \`changes_summary\` text;`)

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`activity_logs_locale_idx\` ON \`activity_logs\` (\`locale\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`activity_logs_locale_label_idx\` ON \`activity_logs\` (\`locale_label\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`activity_logs_actor_label_idx\` ON \`activity_logs\` (\`actor_label\`);`,
  )

  // Backfill readable actor labels for older rows that only had a user relationship (or none).
  await db.run(sql`
    UPDATE \`activity_logs\`
    SET \`actor_label\` = COALESCE(
      (
        SELECT COALESCE(NULLIF(\`users\`.\`name\`, ''), \`users\`.\`email\`)
        FROM \`users\`
        WHERE \`users\`.\`id\` = \`activity_logs\`.\`updated_by_id\`
      ),
      'System'
    )
    WHERE \`actor_label\` IS NULL OR \`actor_label\` = ''
  `)

  await db.run(sql`
    UPDATE \`activity_logs\`
    SET \`locale\` = 'all', \`locale_label\` = 'All languages'
    WHERE \`locale\` IS NULL OR \`locale\` = ''
  `)

  await db.run(sql`
    UPDATE \`activity_logs\`
    SET \`changes_summary\` = 'See document for details'
    WHERE \`changes_summary\` IS NULL OR \`changes_summary\` = ''
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite cannot DROP COLUMN portably across all environments used here.
  await db.run(sql`DROP INDEX IF EXISTS \`activity_logs_locale_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`activity_logs_locale_label_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`activity_logs_actor_label_idx\`;`)
}
