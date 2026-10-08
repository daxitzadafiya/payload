import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Remove Translations-collection keys that duplicate Payload-localized CMS content
 * (Property Filters option labels) or that are unused dead keys.
 *
 * Field chrome keys stay (e.g. propertyList.filters.bedrooms, .sortBy, .features.emptyLabel).
 * Property List CMS dual keys are removed in 20260804_140000_*.
 */

/** Exact keys: dead chrome / unused filters */
const EXACT_KEYS_TO_DELETE = [
  'propertyList.filters.searchProperties',
  'propertyList.filters.location',
  'propertyList.filters.location.emptyLabel',
  'propertyList.filters.location.placeholder',
  'propertyList.filters.state',
  'propertyList.filters.state.emptyLabel',
  'propertyList.filters.status',
  'propertyList.filters.status.emptyLabel',
  'propertyList.filters.status.project',
  'propertyList.filters.status.resale',
  'propertyList.filters.country.emptyLabel',
  // Feature option values (CMS Property Filters) — keep .features and .features.emptyLabel
  'propertyList.filters.features.golf',
  'propertyList.filters.features.mountain',
  'propertyList.filters.features.sea views',
] as const

/** Prefixes: CMS Property Filters option values + dead delivery/distance options */
const PREFIXES_TO_DELETE = [
  'propertyList.sort.',
  'propertyList.filters.bedrooms.',
  'propertyList.filters.bathrooms.',
  'propertyList.filters.minPrice.',
  'propertyList.filters.maxPrice.',
  'propertyList.filters.priceRange.',
  'propertyList.filters.guests.',
  'propertyList.filters.totalBudget.',
  'propertyList.filters.deliveryDate.',
  'propertyList.filters.distanceToSea.',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const likeClauses = PREFIXES_TO_DELETE.map((prefix) => `\`key\` LIKE '${prefix.replace(/'/g, "''")}%'`).join(
    ' OR ',
  )
  const exactList = EXACT_KEYS_TO_DELETE.map((key) => `'${key.replace(/'/g, "''")}'`).join(', ')

  await db.run(sql.raw(`
    DELETE FROM \`payload_locked_documents_rels\`
    WHERE \`translations_id\` IN (
      SELECT \`id\` FROM \`translations\`
      WHERE \`key\` IN (${exactList})
         OR (${likeClauses})
    )
  `))

  await db.run(sql.raw(`
    DELETE FROM \`translations\`
    WHERE \`key\` IN (${exactList})
       OR (${likeClauses})
  `))
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keys are recreated on demand by useTranslation / t() when still referenced in code.
}
