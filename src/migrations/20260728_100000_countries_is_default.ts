import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Add Countries.isDefault so admins can pick the Sale hero pre-selected country.
 * Seeds Spain (ES) as the default to match previous Hero block behaviour.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`countries\` ADD COLUMN \`is_default\` integer DEFAULT 0;`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`countries_is_default_idx\` ON \`countries\` (\`is_default\`);`,
  )
  await db.run(
    sql`UPDATE \`countries\` SET \`is_default\` = 1 WHERE UPPER(\`iso_code\`) = 'ES';`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`countries_is_default_idx\`;`)
  await db.run(sql`ALTER TABLE \`countries\` DROP COLUMN \`is_default\`;`)
}
