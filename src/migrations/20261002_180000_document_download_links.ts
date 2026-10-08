import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql.raw(`
    CREATE TABLE IF NOT EXISTS document_download_links (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      page_url TEXT,
      filename TEXT,
      expires_at INTEGER NOT NULL
    )
  `))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql.raw('DROP TABLE IF EXISTS document_download_links'))
}
