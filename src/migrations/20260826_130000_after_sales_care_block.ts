import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * AfterSalesCareBlock (dbName: ascare / asc_svc).
 * Localized masthead + intro richText + services list.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ascare\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ascare_order_idx\` ON \`ascare\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ascare_parent_id_idx\` ON \`ascare\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`ascare_path_idx\` ON \`ascare\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`ascare_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`eyebrow\` text DEFAULT 'Help & Advice',
      \`title\` text DEFAULT 'After Sales Care by Zariko',
      \`lead\` text DEFAULT 'After your purchase you can also count on Zariko!',
      \`section_heading\` text DEFAULT 'After Sales by Zariko',
      \`intro\` text,
      \`services_heading\` text DEFAULT 'Our after sales services include:',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`ascare\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`ascare_locales_locale_parent_id_unique\` ON \`ascare_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`asc_svc\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`ascare\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`asc_svc_order_idx\` ON \`asc_svc\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`asc_svc_parent_id_idx\` ON \`asc_svc\` (\`_parent_id\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`asc_svc_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`asc_svc\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`asc_svc_locales_locale_parent_id_unique\` ON \`asc_svc_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ascare_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`_path\` text NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`block_name\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_ascare_v_order_idx\` ON \`_ascare_v\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_ascare_v_parent_id_idx\` ON \`_ascare_v\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_ascare_v_path_idx\` ON \`_ascare_v\` (\`_path\`);`)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_ascare_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`eyebrow\` text DEFAULT 'Help & Advice',
      \`title\` text DEFAULT 'After Sales Care by Zariko',
      \`lead\` text DEFAULT 'After your purchase you can also count on Zariko!',
      \`section_heading\` text DEFAULT 'After Sales by Zariko',
      \`intro\` text,
      \`services_heading\` text DEFAULT 'Our after sales services include:',
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ascare_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_ascare_v_locales_locale_parent_id_unique\` ON \`_ascare_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_asc_svc_v\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ascare_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`_asc_svc_v_order_idx\` ON \`_asc_svc_v\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_asc_svc_v_parent_id_idx\` ON \`_asc_svc_v\` (\`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_asc_svc_v_locales\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`text\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_asc_svc_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_asc_svc_v_locales_locale_parent_id_unique\` ON \`_asc_svc_v_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_asc_svc_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_asc_svc_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ascare_v_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`_ascare_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`asc_svc_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`asc_svc\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ascare_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`ascare\`;`)
}
