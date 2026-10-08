import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`theme\` ADD \`custom_c_s_s\` text;`)

  await db.run(sql`ALTER TABLE \`theme\` DROP COLUMN \`colors_primary\`;`)
  await db.run(sql`ALTER TABLE \`theme\` DROP COLUMN \`colors_secondary\`;`)
  await db.run(sql`ALTER TABLE \`theme\` DROP COLUMN \`colors_tertiary\`;`)
  await db.run(sql`ALTER TABLE \`theme\` DROP COLUMN \`colors_surface\`;`)
  await db.run(sql`ALTER TABLE \`theme\` DROP COLUMN \`colors_background\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`theme\` DROP COLUMN \`custom_c_s_s\`;`)

  await db.run(sql`ALTER TABLE \`theme\` ADD \`colors_primary\` text DEFAULT '#000000' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`theme\` ADD \`colors_secondary\` text DEFAULT '#5e5e5c' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`theme\` ADD \`colors_tertiary\` text DEFAULT '#755b00' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`theme\` ADD \`colors_surface\` text DEFAULT '#fef9f1' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`theme\` ADD \`colors_background\` text DEFAULT '#fef9f1' NOT NULL;`)
}
