import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`activity_logs\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`action\` text NOT NULL,
	\`module\` text NOT NULL,
	\`section\` text NOT NULL,
	\`document_id\` text NOT NULL,
	\`document_title\` text,
	\`updated_by_id\` integer,
	\`timestamp\` text NOT NULL,
	\`ip\` text,
	\`user_agent\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`updated_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)

  await db.run(sql`CREATE INDEX \`activity_logs_action_idx\` ON \`activity_logs\` (\`action\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_module_idx\` ON \`activity_logs\` (\`module\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_section_idx\` ON \`activity_logs\` (\`section\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_document_id_idx\` ON \`activity_logs\` (\`document_id\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_updated_by_idx\` ON \`activity_logs\` (\`updated_by_id\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_timestamp_idx\` ON \`activity_logs\` (\`timestamp\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_updated_at_idx\` ON \`activity_logs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_created_at_idx\` ON \`activity_logs\` (\`created_at\`);`)

  await db.run(sql`CREATE TABLE \`activity_logs_changes\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`field\` text NOT NULL,
	\`old_value\` text,
	\`new_value\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`activity_logs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  await db.run(sql`CREATE INDEX \`activity_logs_changes_order_idx\` ON \`activity_logs_changes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`activity_logs_changes_parent_id_idx\` ON \`activity_logs_changes\` (\`_parent_id\`);`)

  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`activity_logs_id\` integer REFERENCES \`activity_logs\`(\`id\`) ON DELETE cascade;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_activity_logs_id_idx\` ON \`payload_locked_documents_rels\` (\`activity_logs_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_activity_logs_id_idx\`;`)
  // SQLite cannot DROP COLUMN reliably across versions; leave the column if present.
  await db.run(sql`DROP TABLE IF EXISTS \`activity_logs_changes\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`activity_logs\`;`)
}
