import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Delete Translations keys that duplicated Property List block CMS fields
 * (favorites empty states + results count suffix). Frontend now uses CMS only.
 */
const EXACT_KEYS_TO_DELETE = [
  'propertyList.emptyState.noFavoritesTitle',
  'propertyList.emptyState.noFavoritesDescription',
  'propertyList.emptyState.noMatchingFavoritesTitle',
  'propertyList.emptyState.noMatchingFavoritesDescription',
  'propertyList.results.extraordinaryProperties',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const exactList = EXACT_KEYS_TO_DELETE.map((key) => `'${key.replace(/'/g, "''")}'`).join(', ')

  await db.run(sql.raw(`
    DELETE FROM \`payload_locked_documents_rels\`
    WHERE \`translations_id\` IN (
      SELECT \`id\` FROM \`translations\`
      WHERE \`key\` IN (${exactList})
    )
  `))

  await db.run(sql.raw(`
    DELETE FROM \`translations\`
    WHERE \`key\` IN (${exactList})
  `))
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keys are no longer requested by the frontend.
}
