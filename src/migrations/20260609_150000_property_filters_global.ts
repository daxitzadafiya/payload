import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`property_filters\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );`)

  await db.run(sql`CREATE TABLE \`property_filters_price_ranges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`min\` text,
  	\`max\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_price_ranges_order_idx\` ON \`property_filters_price_ranges\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_price_ranges_parent_id_idx\` ON \`property_filters_price_ranges\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_price_ranges_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_price_ranges\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_price_ranges_locales_locale_parent_id_unique\` ON \`property_filters_price_ranges_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`property_filters_bedrooms\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_bedrooms_order_idx\` ON \`property_filters_bedrooms\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_bedrooms_parent_id_idx\` ON \`property_filters_bedrooms\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_bedrooms_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_bedrooms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_bedrooms_locales_locale_parent_id_unique\` ON \`property_filters_bedrooms_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`property_filters_min_prices\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_min_prices_order_idx\` ON \`property_filters_min_prices\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_min_prices_parent_id_idx\` ON \`property_filters_min_prices\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_min_prices_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_min_prices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_min_prices_locales_locale_parent_id_unique\` ON \`property_filters_min_prices_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`property_filters_max_prices\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_max_prices_order_idx\` ON \`property_filters_max_prices\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_max_prices_parent_id_idx\` ON \`property_filters_max_prices\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_max_prices_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_max_prices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_max_prices_locales_locale_parent_id_unique\` ON \`property_filters_max_prices_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`property_filters_statuses\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_statuses_order_idx\` ON \`property_filters_statuses\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_statuses_parent_id_idx\` ON \`property_filters_statuses\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_statuses_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_statuses\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_statuses_locales_locale_parent_id_unique\` ON \`property_filters_statuses_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`property_filters_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_features_order_idx\` ON \`property_filters_features\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_features_parent_id_idx\` ON \`property_filters_features\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_features_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_features\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_features_locales_locale_parent_id_unique\` ON \`property_filters_features_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`property_filters_delivery_dates\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_delivery_dates_order_idx\` ON \`property_filters_delivery_dates\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_delivery_dates_parent_id_idx\` ON \`property_filters_delivery_dates\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_delivery_dates_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_delivery_dates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_delivery_dates_locales_locale_parent_id_unique\` ON \`property_filters_delivery_dates_locales\` (\`_locale\`,\`_parent_id\`);`,
  )

  await db.run(sql`CREATE TABLE \`property_filters_distance_to_sea\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`property_filters_distance_to_sea_order_idx\` ON \`property_filters_distance_to_sea\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`property_filters_distance_to_sea_parent_id_idx\` ON \`property_filters_distance_to_sea\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`property_filters_distance_to_sea_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`property_filters_distance_to_sea\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`property_filters_distance_to_sea_locales_locale_parent_id_unique\` ON \`property_filters_distance_to_sea_locales\` (\`_locale\`,\`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`property_filters_distance_to_sea_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_distance_to_sea\`;`)
  await db.run(sql`DROP TABLE \`property_filters_delivery_dates_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_delivery_dates\`;`)
  await db.run(sql`DROP TABLE \`property_filters_features_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_features\`;`)
  await db.run(sql`DROP TABLE \`property_filters_statuses_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_statuses\`;`)
  await db.run(sql`DROP TABLE \`property_filters_max_prices_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_max_prices\`;`)
  await db.run(sql`DROP TABLE \`property_filters_min_prices_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_min_prices\`;`)
  await db.run(sql`DROP TABLE \`property_filters_bedrooms_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_bedrooms\`;`)
  await db.run(sql`DROP TABLE \`property_filters_price_ranges_locales\`;`)
  await db.run(sql`DROP TABLE \`property_filters_price_ranges\`;`)
  await db.run(sql`DROP TABLE \`property_filters\`;`)
}
