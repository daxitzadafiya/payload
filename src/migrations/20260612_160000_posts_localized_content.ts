import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts_locales\` ADD COLUMN \`title\` text;`)
  await db.run(sql`ALTER TABLE \`posts_locales\` ADD COLUMN \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`posts_locales\` ADD COLUMN \`content\` text;`)
  await db.run(sql`ALTER TABLE \`_posts_v_locales\` ADD COLUMN \`version_title\` text;`)
  await db.run(sql`ALTER TABLE \`_posts_v_locales\` ADD COLUMN \`version_subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`_posts_v_locales\` ADD COLUMN \`version_content\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`_posts_v_locales\` DROP COLUMN \`version_content\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v_locales\` DROP COLUMN \`version_subtitle\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v_locales\` DROP COLUMN \`version_title\`;`)
  await db.run(sql`ALTER TABLE \`posts_locales\` DROP COLUMN \`content\`;`)
  await db.run(sql`ALTER TABLE \`posts_locales\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`posts_locales\` DROP COLUMN \`title\`;`)
}
