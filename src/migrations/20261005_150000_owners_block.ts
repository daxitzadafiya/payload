import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * OwnersBlock (dbName: own_blk) and form_submissions.sync_to_optima_owners.
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
  await addColumnIfMissing(db, 'form_submissions', 'sync_to_optima_owners', 'integer')

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`own_blk\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`form_id\` integer,
      \`enable_resubmit\` integer DEFAULT true,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`own_blk_order_idx\` ON \`own_blk\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`own_blk_parent_id_idx\` ON \`own_blk\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`own_blk_path_idx\` ON \`own_blk\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`own_blk_form_idx\` ON \`own_blk\` (\`form_id\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`own_blk_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`form_eyebrow\` text DEFAULT 'Owners',
      \`form_title\` text DEFAULT 'Rent or sell your property',
      \`form_description\` text DEFAULT 'Tell us whether you want to rent out or sell your property, and we will be in touch.',
      \`submit_label_override\` text,
      \`form_trust_note\` text DEFAULT 'Your information is safe with us. We''ll never share your details.',
      \`resubmit_button_label\` text DEFAULT 'Submit another response',
      \`success_title\` text DEFAULT 'Thank you!',
      \`success_subtitle\` text DEFAULT 'Your response has been submitted.',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`own_blk\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`own_blk_locales_locale_parent_id_unique\` ON \`own_blk_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_own_blk_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`form_id\` integer,
      \`enable_resubmit\` integer DEFAULT true,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_own_blk_v_order_idx\` ON \`_own_blk_v\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_own_blk_v_parent_id_idx\` ON \`_own_blk_v\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_own_blk_v_path_idx\` ON \`_own_blk_v\` (\`_path\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_own_blk_v_form_idx\` ON \`_own_blk_v\` (\`form_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_own_blk_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`form_eyebrow\` text DEFAULT 'Owners',
      \`form_title\` text DEFAULT 'Rent or sell your property',
      \`form_description\` text DEFAULT 'Tell us whether you want to rent out or sell your property, and we will be in touch.',
      \`submit_label_override\` text,
      \`form_trust_note\` text DEFAULT 'Your information is safe with us. We''ll never share your details.',
      \`resubmit_button_label\` text DEFAULT 'Submit another response',
      \`success_title\` text DEFAULT 'Thank you!',
      \`success_subtitle\` text DEFAULT 'Your response has been submitted.',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_own_blk_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_own_blk_v_locales_locale_parent_id_unique\` ON \`_own_blk_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_own_blk_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_own_blk_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`own_blk_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`own_blk\`;`)
  await dropColumnIfExists(db, 'form_submissions', 'sync_to_optima_owners')
}
