import React from 'react'

import { cn } from '@/utilities/ui'

type Props = {
  className?: string
  sizeClassName?: string
}

/** Gold L-shaped corner ticks for framed media (Template Two). */
export const GoldCornerTicks: React.FC<Props> = ({
  className,
  sizeClassName = 'h-8 w-8 md:h-10 md:w-10',
}) => (
  <div className={cn('pointer-events-none absolute inset-0 z-10', className)} aria-hidden>
    <span
      className={cn(
        'absolute left-4 top-4 border-l-2 border-t-2 border-secondary md:left-5 md:top-5',
        sizeClassName,
      )}
    />
    <span
      className={cn(
        'absolute right-4 top-4 border-r-2 border-t-2 border-secondary md:right-5 md:top-5',
        sizeClassName,
      )}
    />
    <span
      className={cn(
        'absolute bottom-4 left-4 border-b-2 border-l-2 border-secondary md:bottom-5 md:left-5',
        sizeClassName,
      )}
    />
    <span
      className={cn(
        'absolute bottom-4 right-4 border-b-2 border-r-2 border-secondary md:bottom-5 md:right-5',
        sizeClassName,
      )}
    />
  </div>
)
