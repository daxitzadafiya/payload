import * as React from 'react'

import { cn } from '@/utilities/ui'

import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  className?: string
  animationDelay?: number
}

export const PropertyCardSkeleton: React.FC<Props> = ({
  className,
  animationDelay = 0,
}) => (
  <div
    className={cn(
      'overflow-hidden rounded-[1.5rem] border border-secondary/25 bg-surface-cream shadow-[0_22px_48px_-28px_rgba(0,0,0,0.16)] md:rounded-[1.75rem]',
      className,
    )}
    style={{ '--skeleton-delay': `${animationDelay}s` } as React.CSSProperties}
  >
    <Skeleton className="h-[230px] rounded-none sm:h-[250px] md:h-[280px]" />
    <div className="space-y-3 p-4 md:p-5">
      <Skeleton className="h-3 w-1/3 rounded" />
      <Skeleton className="h-5 w-4/5 rounded" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-14 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <Skeleton className="h-6 w-1/2 rounded" />
      <Skeleton className="mt-1 h-11 w-full rounded-md" />
    </div>
  </div>
)
