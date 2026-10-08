import React from 'react'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { PropertyDetailIcon } from '@/components/PropertyDetail/PropertyDetailIcon'

type SpecItem = {
  icon: string
  label: string
  value: string
}

type Props = {
  items: SpecItem[]
}

export const PropertyDetailSpecs: React.FC<Props> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <section className="relative mb-16 overflow-hidden bg-surface-sand py-14 md:mb-20 md:py-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>
      <DecorativeVectors
        variant="rings"
        className="-right-16 top-4 h-56 w-56 opacity-50 md:h-72 md:w-72"
      />

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-0">
          {items.map((item, index) => (
            <div
              key={item.label}
              className={`flex items-start gap-4 md:px-6 lg:px-8 ${
                index < items.length - 1 ? 'md:border-r md:border-secondary/25' : ''
              } ${index === 0 ? 'md:pl-0' : ''} ${index === items.length - 1 ? 'md:pr-0' : ''}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-secondary/30 bg-surface-cream text-secondary">
                <PropertyDetailIcon name={item.icon} className="text-secondary" size={20} />
              </div>
              <div className="min-w-0">
                <div className="mb-1.5 font-label-nav text-[10px] uppercase tracking-[0.2em] text-on-surface/50">
                  {item.label}
                </div>
                <div className="font-headline-sm text-[1.05rem] font-light leading-snug text-primary md:text-[1.15rem]">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
