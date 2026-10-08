import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`optima_crm_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`api_api_url\` text,
  	\`api_api_key\` text,
  	\`api_contact_url\` text,
  	\`api_user_key\` text,
  	\`api_brochure_template_id\` numeric DEFAULT 39,
  	\`images_image_url_without_resize\` text DEFAULT 'https://images.optima-crm.com/cms_medias/',
  	\`images_image_url\` text DEFAULT 'https://images.optima-crm.com/resize/cms_medias/',
  	\`images_commercial_image_base\` text DEFAULT 'https://images.optima-crm.com/commercial_images',
  	\`images_agency_id\` text,
  	\`images_property_resize_base\` text DEFAULT 'https://images.optima-crm.com/resize/commercial_images/',
  	\`images_site_id\` text DEFAULT '237',
  	\`updated_at\` text,
  	\`created_at\` text
  );`)

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`deepl_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`enabled\` integer,
  	\`api_url\` text DEFAULT 'https://api.deepl.com',
  	\`api_key\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );`)

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`integrations_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`google_maps_api_key\` text,
  	\`recaptcha_site_key\` text,
  	\`recaptcha_secret_key\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`integrations_settings\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`deepl_settings\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`optima_crm_settings\`;`)
}
