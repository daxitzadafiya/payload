import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Advisors descriptions were plain textarea strings. The field is now the same
 * Lexical rich text editor as the email template body, so wrap existing text.
 */
const TABLES = [
  'pages_blocks_advisors_block_advisors_locales',
  '_pages_v_blocks_advisors_block_advisors_locales',
] as const

type DescriptionRow = {
  id: number
  description: string | null
}

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

function isLexicalJson(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) return false

  try {
    const parsed = JSON.parse(trimmed) as { root?: { type?: string } }
    return parsed?.root?.type === 'root'
  } catch {
    return false
  }
}

function plainTextToLexical(value: string): string {
  const lines = value.replace(/\r\n/g, '\n').split('\n')
  const children = lines.map((line) => ({
    type: 'paragraph',
    children: line
      ? [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: line,
            version: 1,
          },
        ]
      : [],
    direction: line ? 'ltr' : null,
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }))

  return JSON.stringify({
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  })
}

function nodeText(node: LexicalNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text' && typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  return node.children.map((child) => nodeText(child)).join('')
}

function lexicalToPlainText(value: string): string | null {
  if (!isLexicalJson(value)) return null

  const parsed = JSON.parse(value) as { root?: { children?: LexicalNode[] } }
  return (parsed.root?.children ?? []).map((child) => nodeText(child)).join('\n')
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

async function tableExists(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql.raw(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.replace(/'/g, "''")}'`,
    ),
  )
  return rows.length > 0
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await tableExists(db, table))) continue

    const rows = await db.all<DescriptionRow>(
      sql.raw(`SELECT \`id\`, \`description\` FROM \`${table}\` WHERE \`description\` IS NOT NULL`),
    )

    for (const row of rows) {
      const description = row.description?.trim()
      if (!description || isLexicalJson(description)) continue

      const lexical = plainTextToLexical(row.description ?? '')
      await db.run(
        sql.raw(
          `UPDATE \`${table}\` SET \`description\` = ${sqlString(lexical)} WHERE \`id\` = ${Number(row.id)}`,
        ),
      )
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await tableExists(db, table))) continue

    const rows = await db.all<DescriptionRow>(
      sql.raw(`SELECT \`id\`, \`description\` FROM \`${table}\` WHERE \`description\` IS NOT NULL`),
    )

    for (const row of rows) {
      if (!row.description) continue
      const plain = lexicalToPlainText(row.description)
      if (plain == null) continue

      await db.run(
        sql.raw(
          `UPDATE \`${table}\` SET \`description\` = ${sqlString(plain)} WHERE \`id\` = ${Number(row.id)}`,
        ),
      )
    }
  }
}
