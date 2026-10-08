import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`media_type\` text DEFAULT 'image' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`image_mode\` text DEFAULT 'single';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`slider_autoplay\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`slider_interval\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`video_source\` text DEFAULT 'youtube';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`youtube_url\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`vimeo_url\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` ADD \`video_upload_id\` integer REFERENCES media(id);`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_block_video_upload_idx\` ON \`pages_blocks_hero_block\` (\`video_upload_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`pages_blocks_hero_block_slider_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_block_slider_images_order_idx\` ON \`pages_blocks_hero_block_slider_images\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_block_slider_images_parent_id_idx\` ON \`pages_blocks_hero_block_slider_images\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_block_slider_images_image_idx\` ON \`pages_blocks_hero_block_slider_images\` (\`image_id\`);`,
  )

  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`media_type\` text DEFAULT 'image' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`image_mode\` text DEFAULT 'single';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`slider_autoplay\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`slider_interval\` numeric DEFAULT 5;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`video_source\` text DEFAULT 'youtube';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`youtube_url\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`vimeo_url\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` ADD \`video_upload_id\` integer REFERENCES media(id);`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_block_video_upload_idx\` ON \`_pages_v_blocks_hero_block\` (\`video_upload_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_block_slider_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_block_slider_images_order_idx\` ON \`_pages_v_blocks_hero_block_slider_images\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_block_slider_images_parent_id_idx\` ON \`_pages_v_blocks_hero_block_slider_images\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_block_slider_images_image_idx\` ON \`_pages_v_blocks_hero_block_slider_images\` (\`image_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_block_slider_images\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_block_slider_images\`;`)

  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`video_upload_id\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`vimeo_url\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`youtube_url\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`video_source\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`slider_interval\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`slider_autoplay\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`image_mode\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_block\` DROP COLUMN \`media_type\`;`)

  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`video_upload_id\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`vimeo_url\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`youtube_url\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`video_source\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`slider_interval\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`slider_autoplay\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`image_mode\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_block\` DROP COLUMN \`media_type\`;`)
}
