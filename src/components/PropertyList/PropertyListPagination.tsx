'use client'

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  page: number
  totalPages: number
  onPageChange?: (page: number) => void
  disabled?: boolean
}

const navButtonClass =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-secondary/35 bg-surface-cream text-primary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary disabled:pointer-events-none disabled:opacity-35'

function getVisiblePages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  for (let i = page - 1; i <= page + 1; i += 1) {
    if (i >= 1 && i <= totalPages) pages.add(i)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]!
    const prev = sorted[i - 1]
    if (prev != null && current - prev > 1) result.push('ellipsis')
    result.push(current)
  }
  return result
}

export const PropertyListPagination: React.FC<Props> = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  const previousPageAria = useTranslation(
    'propertyList.pagination.previousPageAria',
    'Previous page',
  )
  const nextPageAria = useTranslation('propertyList.pagination.nextPageAria', 'Next page')

  const visiblePages = useMemo(() => getVisiblePages(page, totalPages), [page, totalPages])

  if (totalPages <= 1) return null

  const canPrev = page > 1 && !disabled
  const canNext = page < totalPages && !disabled

  return (
    <section className="flex flex-col items-center border-t border-secondary/25 py-10 md:py-12">
      <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Pagination">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange?.(page - 1)}
          className={navButtonClass}
          aria-label={previousPageAria}
        >
          <ChevronLeft size={18} />
        </button>

        {visiblePages.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 min-w-8 items-center justify-center px-1 font-label-sm text-[12px] text-on-surface/45"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={disabled}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange?.(item)}
              className={cn(
                'flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md px-2.5 font-label-nav text-[12px] transition-all duration-300 disabled:pointer-events-none disabled:opacity-35',
                item === page
                  ? 'border border-secondary bg-secondary text-on-secondary shadow-[0_10px_24px_-14px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)]'
                  : 'border border-secondary/30 bg-surface-cream text-primary hover:border-secondary hover:text-secondary',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange?.(page + 1)}
          className={navButtonClass}
          aria-label={nextPageAria}
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </section>
  )
}
