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
 * Footer certifications: replace icon name with Media upload image.
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

  try {
    await db.run(sql`ALTER TABLE \`footer_certifications\` DROP COLUMN \`icon\`;`)
  } catch {
    // Column missing or SQLite without DROP COLUMN — leave orphaned icon column.
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await addColumnIfMissing(db, 'footer_certifications', 'icon', 'text')
  try {
    await db.run(sql`ALTER TABLE \`footer_certifications\` DROP COLUMN \`label\`;`)
  } catch {
    // ignore
  }
  try {
    await db.run(sql`ALTER TABLE \`footer_certifications\` DROP COLUMN \`image_id\`;`)
  } catch {
    // ignore
  }
}
