import type { CSSProperties } from 'react'

const DEFAULT_GAP = 4
const DEFAULT_MAX_HEIGHT = 280
const DEFAULT_VIEWPORT_PADDING = 12
/** Above modals (`z-[100]`) and modal footers */
export const FLOATING_MENU_Z_INDEX = 99999

export type FloatingMenuPlacement = 'auto' | 'top' | 'bottom'

export type FloatingMenuPositionInput = {
  triggerRect: DOMRect
  menuHeight?: number
  /** Measured menu width (after mount) — used to keep fit-content menus on-screen. */
  menuWidth?: number
  gap?: number
  maxMenuHeight?: number
  viewportPadding?: number
  minWidth?: number
  /**
   * Grow with content instead of locking to the trigger width.
   * Still at least as wide as the trigger, and capped by `maxWidth` / viewport.
   */
  fitContent?: boolean
  /** Soft cap so menus do not stretch across the viewport. */
  maxWidth?: number
  placement?: FloatingMenuPlacement
}

/**
 * Positions a portaled dropdown within the viewport.
 * Prefer `placement: 'top'` for fields at the bottom of modals.
 */
export function computeFloatingMenuStyle({
  triggerRect,
  menuHeight = 0,
  menuWidth = 0,
  gap = DEFAULT_GAP,
  maxMenuHeight = DEFAULT_MAX_HEIGHT,
  viewportPadding = DEFAULT_VIEWPORT_PADDING,
  minWidth,
  fitContent = false,
  maxWidth,
  placement = 'auto',
}: FloatingMenuPositionInput): CSSProperties {
  const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding
  const spaceAbove = triggerRect.top - viewportPadding
  const estimatedHeight = menuHeight > 0 ? menuHeight : maxMenuHeight

  const wouldOverflowBelow =
    triggerRect.bottom + gap + estimatedHeight > window.innerHeight - viewportPadding

  const openUp =
    placement === 'top' ||
    (placement === 'auto' &&
      (wouldOverflowBelow || spaceBelow < estimatedHeight) &&
      spaceAbove >= 120)

  const viewportMaxWidth = window.innerWidth - viewportPadding * 2
  const cappedMaxWidth = Math.min(maxWidth ?? viewportMaxWidth, viewportMaxWidth)
  const resolvedMinWidth = Math.max(triggerRect.width, minWidth ?? 0)

  const estimatedWidth =
    menuWidth > 0
      ? Math.min(Math.max(menuWidth, resolvedMinWidth), cappedMaxWidth)
      : Math.min(resolvedMinWidth, cappedMaxWidth)

  let left = triggerRect.left
  if (left + estimatedWidth > window.innerWidth - viewportPadding) {
    left = Math.max(viewportPadding, window.innerWidth - viewportPadding - estimatedWidth)
  }

  const widthStyles: CSSProperties = fitContent
    ? {
        width: 'max-content',
        minWidth: resolvedMinWidth,
        maxWidth: cappedMaxWidth,
      }
    : {
        width: minWidth ? Math.max(triggerRect.width, minWidth) : triggerRect.width,
        maxWidth: cappedMaxWidth,
      }

  if (openUp) {
    const maxHeight = Math.max(120, Math.min(maxMenuHeight, spaceAbove - gap))

    return {
      position: 'fixed',
      left,
      ...widthStyles,
      bottom: window.innerHeight - triggerRect.top + gap,
      maxHeight,
      overflowY: 'auto',
      zIndex: FLOATING_MENU_Z_INDEX,
    }
  }

  const maxHeight = Math.max(120, Math.min(maxMenuHeight, spaceBelow - gap))

  return {
    position: 'fixed',
    top: triggerRect.bottom + gap,
    left,
    ...widthStyles,
    maxHeight,
    overflowY: 'auto',
    zIndex: FLOATING_MENU_Z_INDEX,
  }
}
