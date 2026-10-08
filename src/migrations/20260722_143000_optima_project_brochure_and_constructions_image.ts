import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`optima_crm_settings\` ADD COLUMN \`images_constructions_image_base\` text DEFAULT 'https://images.optima-crm.com/constructions_images';`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite does not support DROP COLUMN in a simple migration path.
  // Keeping columns is safe for rollback in this project.
  await db.run(sql`SELECT 1;`)
}
