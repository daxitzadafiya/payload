import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Owners homepage card: image + button label.
 */
async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition}`))
  } catch {
    // Column already exists when dev schema was pushed ahead of migrations.
  }
}

async function dropColumnIfExists(
  db: MigrateDownArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column missing or SQLite version does not support DROP COLUMN.
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'own_blk', 'image_id', 'integer')
  await addColumnIfMissing(db, '_own_blk_v', 'image_id', 'integer')
  await addColumnIfMissing(
    db,
    'own_blk_locales',
    'cta_label',
    `text DEFAULT 'Create owner'`,
  )
  await addColumnIfMissing(
    db,
    '_own_blk_v_locales',
    'cta_label',
    `text DEFAULT 'Create owner'`,
  )

  await db.run(sql`CREATE INDEX IF NOT EXISTS \`own_blk_image_idx\` ON \`own_blk\` (\`image_id\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_own_blk_v_image_idx\` ON \`_own_blk_v\` (\`image_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropColumnIfExists(db, 'own_blk', 'image_id')
  await dropColumnIfExists(db, '_own_blk_v', 'image_id')
  await dropColumnIfExists(db, 'own_blk_locales', 'cta_label')
  await dropColumnIfExists(db, '_own_blk_v_locales', 'cta_label')
}
