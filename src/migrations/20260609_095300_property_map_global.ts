import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`property_map\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`default_center_lat\` numeric NOT NULL DEFAULT 38.3452,
  	\`default_center_lng\` numeric NOT NULL DEFAULT -0.481,
  	\`default_zoom\` numeric NOT NULL DEFAULT 8,
  	\`min_zoom\` numeric DEFAULT 5,
  	\`max_zoom\` numeric DEFAULT 18,
  	\`enable_draw_search\` integer DEFAULT true,
  	\`cluster_colors_small\` text DEFAULT '#2563eb',
  	\`cluster_colors_medium\` text DEFAULT '#1d4ed8',
  	\`cluster_colors_large\` text DEFAULT '#1e40af',
  	\`map_fetch_limit\` numeric DEFAULT 10,
  	\`updated_at\` text,
  	\`created_at\` text
  );`)

  await db.run(sql`CREATE TABLE \`property_map_locales\` (
  	\`modal_title\` text DEFAULT 'Map',
  	\`draw_instruction_text\` text DEFAULT 'Draw A Shape Around The Region(S) You Would Like To Search',
  	\`draw_button_label\` text DEFAULT 'Draw your area on the map',
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_map\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  await db.run(
    sql`CREATE UNIQUE INDEX \`property_map_locales_locale_parent_id_unique\` ON \`property_map_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`ALTER TABLE \`pages_blocks_property_list_block\` ADD \`show_map\` integer;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_property_list_block\` DROP COLUMN \`show_map\`;`)
  await db.run(sql`DROP TABLE \`property_map_locales\`;`)
  await db.run(sql`DROP TABLE \`property_map\`;`)
}
