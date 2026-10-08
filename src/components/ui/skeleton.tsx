import { cn } from '@/utilities/ui'
import * as React from 'react'

const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('skeleton-shimmer bg-surface-container-high', className)} {...props} />
)

export { Skeleton }
