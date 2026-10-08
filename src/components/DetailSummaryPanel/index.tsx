import React from 'react'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { cn } from '@/utilities/ui'

type Props = {
  children: React.ReactNode
  className?: string
}

/** Shared sticky summary panel for property/project detail heroes. */
export const DetailSummaryPanel: React.FC<Props> = ({ children, className }) => {
  return (
    <aside
      className={cn(
        'relative flex flex-col overflow-hidden rounded-[1.75rem] border border-secondary/25 bg-surface-cream p-6 shadow-[0_28px_60px_-32px_rgba(0,0,0,0.22)] sm:p-7 lg:sticky lg:top-32 lg:col-span-5 lg:self-start lg:p-8 xl:col-span-4 md:rounded-[2rem]',
        className,
      )}
    >
      <DecorativeVectors
        variant="rings"
        className="-right-16 -top-10 h-48 w-48 opacity-70 md:h-56 md:w-56"
      />
      <div className="relative z-[1] flex flex-col">{children}</div>
    </aside>
  )
}
