import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`translations_id\` integer REFERENCES \`translations\`(\`id\`) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_translations_id_idx\` ON \`payload_locked_documents_rels\` (\`translations_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`DROP INDEX \`payload_locked_documents_rels_translations_id_idx\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`translations_id\`;`,
  )
}
