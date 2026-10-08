import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function addIndexIfMissing(db: MigrateUpArgs['db'], name: string, table: string, column: string) {
  await db.run(sql.raw(`CREATE INDEX IF NOT EXISTS \`${name}\` ON \`${table}\` (\`${column}\`)`))
}

/**
 * FK indexes for collage uploads, plus About Us page defaults
 * (hero stats bar, CTA, overlapping collage images).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  const imageIndexes: Array<[string, string, string]> = [
    ['pages_blocks_mission_block_collage_image2_idx', 'pages_blocks_mission_block', 'collage_image2_id'],
    ['pages_blocks_mission_block_collage_image3_idx', 'pages_blocks_mission_block', 'collage_image3_id'],
    ['pages_blocks_who_we_are_block_collage_image2_idx', 'pages_blocks_who_we_are_block', 'collage_image2_id'],
    ['pages_blocks_who_we_are_block_collage_image3_idx', 'pages_blocks_who_we_are_block', 'collage_image3_id'],
    ['_pages_v_blocks_mission_block_collage_image2_idx', '_pages_v_blocks_mission_block', 'collage_image2_id'],
    ['_pages_v_blocks_mission_block_collage_image3_idx', '_pages_v_blocks_mission_block', 'collage_image3_id'],
    ['_pages_v_blocks_who_we_are_block_collage_image2_idx', '_pages_v_blocks_who_we_are_block', 'collage_image2_id'],
    ['_pages_v_blocks_who_we_are_block_collage_image3_idx', '_pages_v_blocks_who_we_are_block', 'collage_image3_id'],
  ]

  for (const [name, table, column] of imageIndexes) {
    await addIndexIfMissing(db, name, table, column)
  }

  const stats: Array<{ id: string; order: number; icon: string; locales: Record<string, [string, string]> }> =
    [
      {
        id: 'about-us-hero-stat-established',
        order: 0,
        icon: 'calendar',
        locales: {
          en: ['1999', 'Established'],
          fr: ['1999', 'Fondée'],
          es: ['1999', 'Fundada'],
        },
      },
      {
        id: 'about-us-hero-stat-clients',
        order: 1,
        icon: 'users',
        locales: {
          en: ['500+', 'Happy Clients'],
          fr: ['500+', 'Clients satisfaits'],
          es: ['500+', 'Clientes satisfechos'],
        },
      },
      {
        id: 'about-us-hero-stat-experience',
        order: 2,
        icon: 'clock',
        locales: {
          en: ['20+', 'Years Experience'],
          fr: ['20+', "Années d'expérience"],
          es: ['20+', 'Años de experiencia'],
        },
      },
    ]

  for (const stat of stats) {
    await db.run(sql.raw(`
      INSERT INTO \`pages_blocks_about_us_hero_block_stats\` (\`_order\`, \`_parent_id\`, \`id\`, \`icon\`)
      SELECT ${stat.order}, h.\`id\`, '${stat.id}', '${stat.icon}'
      FROM \`pages_blocks_about_us_hero_block\` h
      INNER JOIN \`pages\` p ON p.\`id\` = h.\`_parent_id\`
      WHERE p.\`slug\` = 'about-us'
        AND NOT EXISTS (
          SELECT 1 FROM \`pages_blocks_about_us_hero_block_stats\` s WHERE s.\`id\` = '${stat.id}'
        )
    `))

    for (const [locale, [value, label]] of Object.entries(stat.locales)) {
      const escapedLabel = label.replace(/'/g, "''")
      await db.run(sql.raw(`
        INSERT INTO \`pages_blocks_about_us_hero_block_stats_locales\` (\`_locale\`, \`_parent_id\`, \`value\`, \`label\`)
        SELECT '${locale}', '${stat.id}', '${value}', '${escapedLabel}'
        WHERE EXISTS (
          SELECT 1 FROM \`pages_blocks_about_us_hero_block_stats\` s WHERE s.\`id\` = '${stat.id}'
        )
          AND NOT EXISTS (
            SELECT 1 FROM \`pages_blocks_about_us_hero_block_stats_locales\` l
            WHERE l.\`_parent_id\` = '${stat.id}' AND l.\`_locale\` = '${locale}'
          )
      `))
    }
  }

  await db.run(sql`
    UPDATE \`pages_blocks_about_us_hero_block\`
    SET \`cta_link_type\` = 'custom'
    WHERE \`_parent_id\` IN (SELECT \`id\` FROM \`pages\` WHERE \`slug\` = 'about-us')
  `)

  await db.run(sql`
    UPDATE \`pages_blocks_about_us_hero_block_locales\`
    SET
      \`button_text\` = CASE \`_locale\`
        WHEN 'fr' THEN 'Découvrir les biens'
        WHEN 'es' THEN 'Explorar propiedades'
        ELSE 'Explore Properties'
      END,
      \`cta_link_url\` = '/property-for-sale'
    WHERE \`_parent_id\` IN (
      SELECT h.\`id\` FROM \`pages_blocks_about_us_hero_block\` h
      INNER JOIN \`pages\` p ON p.\`id\` = h.\`_parent_id\`
      WHERE p.\`slug\` = 'about-us'
    )
      AND (\`button_text\` IS NULL OR \`button_text\` = '')
  `)

  await db.run(sql`
    UPDATE \`pages_blocks_mission_block\`
    SET
      \`collage_image2_id\` = COALESCE(
        \`collage_image2_id\`,
        (
          SELECT f.\`portrait_id\`
          FROM \`pages_blocks_founder_spotlight_block\` f
          WHERE f.\`_parent_id\` = \`pages_blocks_mission_block\`.\`_parent_id\`
          LIMIT 1
        )
      ),
      \`collage_image3_id\` = COALESCE(
        \`collage_image3_id\`,
        (
          SELECT v.\`background_image_id\`
          FROM \`vtour\` v
          WHERE v.\`_parent_id\` = \`pages_blocks_mission_block\`.\`_parent_id\`
          LIMIT 1
        )
      )
    WHERE \`_parent_id\` IN (SELECT \`id\` FROM \`pages\` WHERE \`slug\` = 'about-us')
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DELETE FROM \`pages_blocks_about_us_hero_block_stats_locales\` WHERE \`_parent_id\` LIKE 'about-us-hero-stat-%'`)
  await db.run(sql`DELETE FROM \`pages_blocks_about_us_hero_block_stats\` WHERE \`id\` LIKE 'about-us-hero-stat-%'`)
}
