import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`header_nav_items_sub_nav\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`sub_lnk_type\` text DEFAULT 'reference',
  	\`sub_lnk_new_tab\` integer,
  	\`sub_lnk_url\` text,
  	\`sub_lnk_label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_nav_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`header_nav_items_sub_nav_order_idx\` ON \`header_nav_items_sub_nav\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_sub_nav_parent_id_idx\` ON \`header_nav_items_sub_nav\` (\`_parent_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`header_nav_items_sub_nav\`;`)
}
