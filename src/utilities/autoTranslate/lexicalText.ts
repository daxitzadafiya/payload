type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

export function isLexicalRichText(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const root = (value as { root?: unknown }).root
  return Boolean(root && typeof root === 'object')
}

function extractTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') return ''

  const lexicalNode = node as LexicalNode

  if (lexicalNode.type === 'text' && typeof lexicalNode.text === 'string') {
    return lexicalNode.text
  }

  if (!Array.isArray(lexicalNode.children)) return ''

  return lexicalNode.children.map(extractTextFromNode).join('')
}

/** Plain-text fingerprint for change detection and empty checks. */
export function lexicalPlainText(state: unknown): string {
  if (!isLexicalRichText(state)) return ''

  const root = (state as { root: { children?: unknown[] } }).root
  const parts = (root.children ?? [])
    .map((child) => extractTextFromNode(child))
    .map((text) => text.trim())
    .filter(Boolean)

  return parts.join('\n\n')
}

async function translateLexicalNode(
  node: LexicalNode,
  translate: (text: string) => Promise<string | null>,
): Promise<LexicalNode> {
  const next: LexicalNode = { ...node }

  if (next.type === 'text' && typeof next.text === 'string' && next.text.trim()) {
    const translated = await translate(next.text)
    if (translated) next.text = translated
  }

  if (Array.isArray(next.children)) {
    next.children = await Promise.all(
      next.children.map((child) => translateLexicalNode(child, translate)),
    )
  }

  return next
}

export async function translateLexicalRichText(
  state: unknown,
  translate: (text: string) => Promise<string | null>,
): Promise<unknown | null> {
  if (!isLexicalRichText(state)) return null

  const root = (state as { root: LexicalNode }).root
  const translatedRoot = await translateLexicalNode(root, translate)

  return {
    ...(state as Record<string, unknown>),
    root: translatedRoot,
  }
}
