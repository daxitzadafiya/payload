import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`weather_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`enabled\` integer,
  	\`base_url\` text DEFAULT 'https://api.weatherapi.com/v1/current.json',
  	\`api_key\` text,
  	\`location\` text DEFAULT 'Javea',
  	\`cache_interval_minutes\` numeric DEFAULT 5,
  	\`updated_at\` text,
  	\`created_at\` text
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`weather_settings\`;`)
}
