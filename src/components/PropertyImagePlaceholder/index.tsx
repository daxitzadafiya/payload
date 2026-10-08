import React from 'react'
import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

type PropertyImagePlaceholderProps = {
  className?: string
}

/**
 * In-card placeholder when a property has no CRM attachment or CMS image.
 * Uses theme tokens so it stays consistent across surface backgrounds.
 */
export const PropertyImagePlaceholder: React.FC<PropertyImagePlaceholderProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center overflow-hidden',
        'bg-linear-to-b from-surface-container-high via-surface-container-low to-surface',
        className,
      )}
      role="img"
      aria-label="Property image unavailable"
    >
      <div className="relative  flex h-full w-full flex-col items-center justify-center text-center">
        <img
          src="/placeholder-property.png"
          alt=""
          aria-hidden
          className="h-full w-full object-contain"
        />
        <p className="mt-4 absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-tertiary/90 font-label-nav text-label-nav tracking-[0.16em] uppercase">
          {useTranslation('propertyImagePlaceholder.noImageFound', 'No Image Found')}
        </p>
      </div>
    </div>
  )
}
