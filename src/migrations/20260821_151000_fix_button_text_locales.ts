import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Button labels were copied as English defaults into every locale.
 * Backfill common ES/FR translations so UI matches other localized fields.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    UPDATE \`svc_items_locales\`
    SET \`button_text\` = 'Más información'
    WHERE \`_locale\` = 'es' AND \`button_text\` = 'More Info';
  `)
  await db.run(sql`
    UPDATE \`svc_items_locales\`
    SET \`button_text\` = 'Plus d''infos'
    WHERE \`_locale\` = 'fr' AND \`button_text\` = 'More Info';
  `)

  await db.run(sql`
    UPDATE \`_svc_items_v_locales\`
    SET \`button_text\` = 'Más información'
    WHERE \`_locale\` = 'es' AND \`button_text\` = 'More Info';
  `)
  await db.run(sql`
    UPDATE \`_svc_items_v_locales\`
    SET \`button_text\` = 'Plus d''infos'
    WHERE \`_locale\` = 'fr' AND \`button_text\` = 'More Info';
  `)

  await db.run(sql`
    UPDATE \`info_items_locales\`
    SET \`button_text\` = 'Ver más'
    WHERE \`_locale\` = 'es' AND \`button_text\` = 'View More';
  `)
  await db.run(sql`
    UPDATE \`info_items_locales\`
    SET \`button_text\` = 'Voir plus'
    WHERE \`_locale\` = 'fr' AND \`button_text\` = 'View More';
  `)

  await db.run(sql`
    UPDATE \`_info_items_v_locales\`
    SET \`button_text\` = 'Ver más'
    WHERE \`_locale\` = 'es' AND \`button_text\` = 'View More';
  `)
  await db.run(sql`
    UPDATE \`_info_items_v_locales\`
    SET \`button_text\` = 'Voir plus'
    WHERE \`_locale\` = 'fr' AND \`button_text\` = 'View More';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`
    UPDATE \`svc_items_locales\`
    SET \`button_text\` = 'More Info'
    WHERE \`_locale\` IN ('es', 'fr')
      AND \`button_text\` IN ('Más información', 'Plus d''infos');
  `)
  await db.run(sql`
    UPDATE \`_svc_items_v_locales\`
    SET \`button_text\` = 'More Info'
    WHERE \`_locale\` IN ('es', 'fr')
      AND \`button_text\` IN ('Más información', 'Plus d''infos');
  `)
  await db.run(sql`
    UPDATE \`info_items_locales\`
    SET \`button_text\` = 'View More'
    WHERE \`_locale\` IN ('es', 'fr')
      AND \`button_text\` IN ('Ver más', 'Voir plus');
  `)
  await db.run(sql`
    UPDATE \`_info_items_v_locales\`
    SET \`button_text\` = 'View More'
    WHERE \`_locale\` IN ('es', 'fr')
      AND \`button_text\` IN ('Ver más', 'Voir plus');
  `)
}
