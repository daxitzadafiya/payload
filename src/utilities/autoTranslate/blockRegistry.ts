import { pageLayoutBlocks } from '@/blocks/pageLayoutBlocks'

import { buildBlockFieldPathRegistry } from './discoverFieldPaths'

/**
 * Built automatically from `pageLayoutBlocks` field configs.
 * Add a new block to `pageLayoutBlocks` — no manual path list needed.
 */
const LOCALIZED_BLOCK_FIELD_PATHS = buildBlockFieldPathRegistry(pageLayoutBlocks)

export function getRegisteredBlockTypes(): string[] {
  return Object.keys(LOCALIZED_BLOCK_FIELD_PATHS)
}

export function getFieldPathsForBlock(blockType: string): readonly string[] {
  return LOCALIZED_BLOCK_FIELD_PATHS[blockType]?.strings ?? []
}

export function getRichTextFieldPathsForBlock(blockType: string): readonly string[] {
  return LOCALIZED_BLOCK_FIELD_PATHS[blockType]?.richText ?? []
}

export function layoutHasTranslatableBlocks(
  layout: Array<{ blockType?: string }> | null | undefined,
): boolean {
  if (!layout?.length) return false

  return layout.some((block) => {
    if (!block.blockType) return false
    const registry = LOCALIZED_BLOCK_FIELD_PATHS[block.blockType]
    if (!registry) return false
    return registry.strings.length > 0 || registry.richText.length > 0
  })
}
