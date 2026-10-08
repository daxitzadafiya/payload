import type { Page } from '@/payload-types'

import { getFieldPathsForBlock, getRichTextFieldPathsForBlock } from './blockRegistry'
import {
  collectLocalizedRichText,
  collectLocalizedStrings,
  setLocalizedRichText,
  setLocalizedString,
} from './fieldPaths'
import { isLexicalRichText, lexicalPlainText, translateLexicalRichText } from './lexicalText'
import { shouldAutoTranslateTarget } from './documentTranslate'

export type LayoutBlock = NonNullable<Page['layout']>[number]

export type LayoutFieldPatch =
  | { kind: 'string'; value: string }
  | { kind: 'richtext'; value: Record<string, unknown> }

export type LayoutFieldPatches = Map<string, Map<string, LayoutFieldPatch>>

function asRecord(block: LayoutBlock): Record<string, unknown> {
  return block as unknown as Record<string, unknown>
}

function findBlockById(
  layout: Page['layout'] | null | undefined,
  blockId: string,
): LayoutBlock | undefined {
  return layout?.find((block) => block.id === blockId)
}

function findAlignedBlock(
  sourceBlock: LayoutBlock,
  sourceLayout: Page['layout'] | null | undefined,
  targetLayout: Page['layout'] | null | undefined,
  previousLayout: Page['layout'] | null | undefined,
): LayoutBlock | undefined {
  if (!targetLayout?.length || !sourceBlock.id) return undefined

  const byId = findBlockById(targetLayout, sourceBlock.id)
  if (byId) return byId

  const previousIndex = previousLayout?.findIndex((block) => block.id === sourceBlock.id) ?? -1
  if (previousIndex >= 0 && targetLayout[previousIndex]) return targetLayout[previousIndex]

  const sourceIndex = sourceLayout?.findIndex((block) => block.id === sourceBlock.id) ?? -1
  if (sourceIndex >= 0) return targetLayout[sourceIndex]

  return undefined
}

function collectBlockStringFingerprints(block: LayoutBlock): Map<string, string> {
  const paths = getFieldPathsForBlock(block.blockType)
  const values = new Map<string, string>()

  for (const fieldPath of paths) {
    for (const field of collectLocalizedStrings(asRecord(block), fieldPath)) {
      values.set(field.path, field.value)
    }
  }

  return values
}

function collectBlockRichTextFingerprints(block: LayoutBlock): Map<string, string> {
  const paths = getRichTextFieldPathsForBlock(block.blockType)
  const values = new Map<string, string>()

  for (const fieldPath of paths) {
    for (const field of collectLocalizedRichText(asRecord(block), fieldPath)) {
      const plainText = lexicalPlainText(field.value)
      if (plainText) values.set(field.path, plainText)
    }
  }

  return values
}

function collectBlockFingerprints(block: LayoutBlock): Map<string, string> {
  return new Map([
    ...collectBlockStringFingerprints(block),
    ...collectBlockRichTextFingerprints(block),
  ])
}

function collectBlockRichTextValues(block: LayoutBlock): Map<string, Record<string, unknown>> {
  const paths = getRichTextFieldPathsForBlock(block.blockType)
  const values = new Map<string, Record<string, unknown>>()

  for (const fieldPath of paths) {
    for (const field of collectLocalizedRichText(asRecord(block), fieldPath)) {
      values.set(field.path, field.value)
    }
  }

  return values
}

function blockHasTranslatableFields(block: LayoutBlock): boolean {
  return (
    getFieldPathsForBlock(block.blockType).length > 0 ||
    getRichTextFieldPathsForBlock(block.blockType).length > 0
  )
}

export function layoutLocalizedFieldsChanged(
  currentLayout: Page['layout'] | null | undefined,
  previousLayout: Page['layout'] | null | undefined,
): boolean {
  if (!currentLayout?.length) return false

  for (const block of currentLayout) {
    if (!block.id || !blockHasTranslatableFields(block)) continue

    const currentValues = collectBlockFingerprints(block)
    if (!previousLayout) {
      if (currentValues.size > 0) return true
      continue
    }

    const previousBlock = findBlockById(previousLayout, block.id)
    if (!previousBlock) return true

    const previousValues = collectBlockFingerprints(previousBlock)

    for (const [path, value] of currentValues) {
      if (value !== (previousValues.get(path) ?? '')) return true
    }

    for (const [path, value] of previousValues) {
      if (value && !currentValues.has(path)) return true
    }
  }

  return false
}

export async function buildLayoutPatches(
  sourceLayout: Page['layout'] | null | undefined,
  previousLayout: Page['layout'] | null | undefined,
  targetLayout: Page['layout'] | null | undefined,
  translate: (text: string, targetLocale: string) => Promise<string | null>,
  targetLocale: string,
): Promise<LayoutFieldPatches> {
  const patches: LayoutFieldPatches = new Map()
  let translatedAny = false

  if (!sourceLayout?.length) return patches

  for (const sourceBlock of sourceLayout) {
    if (!sourceBlock.id || !blockHasTranslatableFields(sourceBlock)) continue

    const previousBlock = previousLayout
      ? findBlockById(previousLayout, sourceBlock.id)
      : undefined
    const targetBlock = findAlignedBlock(
      sourceBlock,
      sourceLayout,
      targetLayout,
      previousLayout,
    )

    const sourceStrings = collectBlockStringFingerprints(sourceBlock)
    const previousStrings = previousBlock
      ? collectBlockStringFingerprints(previousBlock)
      : new Map()
    const targetStrings = targetBlock ? collectBlockStringFingerprints(targetBlock) : new Map()

    const sourceRichText = collectBlockRichTextValues(sourceBlock)
    const previousRichText = previousBlock
      ? collectBlockRichTextValues(previousBlock)
      : new Map()
    const targetRichText = targetBlock ? collectBlockRichTextValues(targetBlock) : new Map()

    const blockPatches = new Map<string, LayoutFieldPatch>()

    for (const [path, sourceText] of sourceStrings) {
      const previousSourceText = previousStrings.get(path) ?? ''
      const existingText = targetStrings.get(path) ?? ''

      if (!shouldAutoTranslateTarget(sourceText, previousSourceText, existingText)) {
        if (existingText) blockPatches.set(path, { kind: 'string', value: existingText })
        continue
      }

      translatedAny = true
      const translated = await translate(sourceText, targetLocale)
      if (translated) {
        blockPatches.set(path, { kind: 'string', value: translated })
      }
    }

    for (const [path, sourceValue] of sourceRichText) {
      const sourceFingerprint = lexicalPlainText(sourceValue)
      if (!sourceFingerprint) continue

      const previousFingerprint = previousRichText.has(path)
        ? lexicalPlainText(previousRichText.get(path))
        : ''
      const existingRichText = targetRichText.get(path)
      const existingFingerprint = existingRichText
        ? lexicalPlainText(existingRichText)
        : ''

      if (
        !shouldAutoTranslateTarget(sourceFingerprint, previousFingerprint, existingFingerprint)
      ) {
        if (existingFingerprint && existingRichText) {
          blockPatches.set(path, { kind: 'richtext', value: existingRichText })
        }
        continue
      }

      translatedAny = true
      const translated = await translateLexicalRichText(sourceValue, (text) =>
        translate(text, targetLocale),
      )

      if (translated && isLexicalRichText(translated)) {
        blockPatches.set(path, { kind: 'richtext', value: translated })
      }
    }

    if (blockPatches.size > 0) {
      patches.set(sourceBlock.id, blockPatches)
    }
  }

  return translatedAny ? patches : new Map()
}

export function applyLayoutPatches(
  layout: Page['layout'] | null | undefined,
  patches: LayoutFieldPatches,
): Page['layout'] | undefined {
  if (!layout?.length || patches.size === 0) return undefined

  let changed = false

  const next = layout.map((block) => {
    if (!block.id) return block

    const blockPatches = patches.get(block.id)
    if (!blockPatches || blockPatches.size === 0) return block

    const clone = structuredClone(asRecord(block))
    let blockChanged = false

    for (const [path, patch] of blockPatches) {
      const applied =
        patch.kind === 'string'
          ? setLocalizedString(clone, path, patch.value)
          : setLocalizedRichText(clone, path, patch.value)

      if (applied) blockChanged = true
    }

    if (!blockChanged) return block

    changed = true
    return clone as unknown as LayoutBlock
  })

  return changed ? next : undefined
}
