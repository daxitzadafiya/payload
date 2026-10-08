'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'

import { useTranslation } from '@/utilities/translateClient'

type Props = {
  children: React.ReactNode
  collapsedHeight?: number
  fadeFromClassName?: string
}

export const DetailReadMore: React.FC<Props> = ({
  children,
  collapsedHeight = 168,
  fadeFromClassName = 'from-surface-cream',
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [needsClamp, setNeedsClamp] = useState(false)
  const readMoreLabel = useTranslation('propertyDetail.description.readMore', 'Read more')
  const readLessLabel = useTranslation('propertyDetail.description.readLess', 'Read less')

  useLayoutEffect(() => {
    const element = contentRef.current
    if (!element) return

    const update = () => {
      setNeedsClamp(element.scrollHeight > collapsedHeight + 12)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [children, collapsedHeight])

  const clamped = needsClamp && !expanded

  return (
    <div>
      <div className="relative">
        <div
          ref={contentRef}
          className={clamped ? 'overflow-hidden' : undefined}
          style={clamped ? { maxHeight: collapsedHeight } : undefined}
        >
          {children}
        </div>
        {clamped ? (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t ${fadeFromClassName} to-transparent`}
            aria-hidden
          />
        ) : null}
      </div>
      {needsClamp ? (
        <button
          type="button"
          className="mt-5 cursor-pointer font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors hover:text-primary"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? readLessLabel : readMoreLabel}
        </button>
      ) : null}
    </div>
  )
}
