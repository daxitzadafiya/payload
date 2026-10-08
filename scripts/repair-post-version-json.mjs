/**
 * Repair corrupted JSON in _posts_v_locales by copying valid content from posts_locales.
 *
 * Only fixes version_content / version_* locale rows where the matching published
 * posts_locales row has valid JSON for the same post + locale.
 *
 * Usage:
 *   DATABASE_URL=file:./roumpos.db node scripts/repair-post-version-json.mjs
 *   DATABASE_URL=file:./roumpos.db node scripts/repair-post-version-json.mjs --dry-run
 */
import { createClient } from '@libsql/client'

const dryRun = process.argv.includes('--dry-run')
const dbUrl = process.env.DATABASE_URL || 'file:./roumpos.db'
const client = createClient({ url: dbUrl })

function isInvalidJson(val) {
  if (val == null || val === '') return false
  const s = String(val)
  if (!s.startsWith('{') && !s.startsWith('[')) return false
  try {
    JSON.parse(s)
    return false
  } catch {
    return true
  }
}

/** Map version column name -> published posts_locales column name */
const VERSION_TO_PUBLISHED = {
  version_content: 'content',
  version_title: 'title',
  version_subtitle: 'subtitle',
  version_meta_title: 'meta_title',
  version_meta_description: 'meta_description',
}

const localeRows = await client.execute(
  `SELECT id, _locale, _parent_id, version_content, version_title, version_subtitle,
          version_meta_title, version_meta_description
   FROM _posts_v_locales`,
)

let repaired = 0
let skipped = 0

for (const row of localeRows.rows) {
  const versionId = row._parent_id
  const locale = row._locale

  const version = await client.execute({
    sql: `SELECT id, parent_id FROM _posts_v WHERE id = ?`,
    args: [versionId],
  })
  const postId = version.rows[0]?.parent_id
  if (!postId) {
    if (Object.keys(VERSION_TO_PUBLISHED).some((col) => isInvalidJson(row[col]))) {
      console.warn(`Cannot repair locale row ${row.id}: version ${versionId} has no parent post`)
      skipped++
    }
    continue
  }

  const published = await client.execute({
    sql: `SELECT content, title, subtitle, meta_title, meta_description
          FROM posts_locales WHERE _parent_id = ? AND _locale = ?`,
    args: [postId, locale],
  })
  const pub = published.rows[0]

  const updates = []
  const args = []

  for (const [versionCol, publishedCol] of Object.entries(VERSION_TO_PUBLISHED)) {
    if (!isInvalidJson(row[versionCol])) continue

    if (!pub) {
      console.warn(
        `Cannot repair ${versionCol} on locale row ${row.id}: no published posts_locales for post ${postId} locale ${locale}`,
      )
      skipped++
      continue
    }

    const source = pub[publishedCol]
    if (source == null || source === '') {
      console.warn(
        `Cannot repair ${versionCol} on locale row ${row.id}: published ${publishedCol} is empty`,
      )
      skipped++
      continue
    }

    if (publishedCol === 'content') {
      try {
        JSON.parse(String(source))
      } catch (e) {
        console.warn(
          `Cannot repair ${versionCol} on locale row ${row.id}: published ${publishedCol} is also invalid (${e.message})`,
        )
        skipped++
        continue
      }
    }

    updates.push(`${versionCol} = ?`)
    args.push(source)
  }

  if (updates.length === 0) continue

  const label = `post ${postId} locale ${locale} (_posts_v_locales id ${row.id}, version ${versionId})`
  if (dryRun) {
    console.log(`[dry-run] Would repair ${updates.length} column(s) for ${label}`)
    repaired++
    continue
  }

  await client.execute({
    sql: `UPDATE _posts_v_locales SET ${updates.join(', ')} WHERE id = ?`,
    args: [...args, row.id],
  })
  console.log(`Repaired ${updates.length} column(s) for ${label}`)
  repaired++
}

console.log(`Done. Repaired: ${repaired}, skipped: ${skipped}${dryRun ? ' (dry-run)' : ''}.`)

if (!dryRun && repaired > 0) {
  console.log('Re-run: node scripts/find-bad-json.mjs')
}
