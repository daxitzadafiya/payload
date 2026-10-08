import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts\` ADD COLUMN \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD COLUMN \`version_subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`arts\` ADD COLUMN \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`arts\` ADD COLUMN \`excerpt\` text;`)
  await db.run(sql`ALTER TABLE \`arts\` ADD COLUMN \`published_at\` text;`)
  await db.run(sql`ALTER TABLE \`_arts_v\` ADD COLUMN \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`_arts_v\` ADD COLUMN \`excerpt\` text;`)
  await db.run(sql`ALTER TABLE \`_arts_v\` ADD COLUMN \`published_at\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`version_subtitle\`;`)
  await db.run(sql`ALTER TABLE \`arts\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`arts\` DROP COLUMN \`excerpt\`;`)
  await db.run(sql`ALTER TABLE \`arts\` DROP COLUMN \`published_at\`;`)
  await db.run(sql`ALTER TABLE \`_arts_v\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`_arts_v\` DROP COLUMN \`excerpt\`;`)
  await db.run(sql`ALTER TABLE \`_arts_v\` DROP COLUMN \`published_at\`;`)
}
