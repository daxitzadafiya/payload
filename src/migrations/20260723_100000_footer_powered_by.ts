import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`footer_locales\` ADD \`powered_by_text\` text DEFAULT 'Powered by';`,
  )
  await db.run(
    sql`ALTER TABLE \`footer_locales\` ADD \`powered_by_link_label\` text DEFAULT 'Optima-CRM';`,
  )
  await db.run(
    sql`ALTER TABLE \`footer\` ADD \`powered_by_url\` text DEFAULT 'https://optima-crm.com';`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`footer_locales\` DROP COLUMN \`powered_by_text\`;`)
  await db.run(sql`ALTER TABLE \`footer_locales\` DROP COLUMN \`powered_by_link_label\`;`)
  await db.run(sql`ALTER TABLE \`footer\` DROP COLUMN \`powered_by_url\`;`)
}
