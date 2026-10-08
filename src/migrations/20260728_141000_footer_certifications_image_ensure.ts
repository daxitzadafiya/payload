import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
  } catch {
    // Already present.
  }
}

/**
 * Ensure footer certifications image/label columns exist
 * (covers DBs where the previous migration was recorded but columns were missing).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(
    db,
    'footer_certifications',
    'image_id',
    'integer REFERENCES media(id) ON DELETE set null',
  )
  await addColumnIfMissing(db, 'footer_certifications', 'label', 'text')
  try {
    await db.run(
      sql`CREATE INDEX IF NOT EXISTS \`footer_certifications_image_idx\` ON \`footer_certifications\` (\`image_id\`);`,
    )
  } catch {
    // ignore
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // no-op
}
