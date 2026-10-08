'use client'

import React from 'react'
import { MapPin } from 'lucide-react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'

type Props = Extract<Page['layout'][0], { blockType: 'interactiveMapBlock' }>

export const InteractiveMapBlock: React.FC<Props> = ({ subtitle, title, locations, offices, mapImage, pins }) => {
  const ref = useReveal()

  return (
    <section ref={ref} className="bg-primary py-16 md:py-24 text-white reveal">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-4 flex flex-col justify-center">
          {subtitle && (
            <span className="text-tertiary font-label-nav text-label-nav tracking-[0.3em] uppercase mb-4">
              {subtitle}
            </span>
          )}
          <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg mb-6 md:mb-8 leading-tight">
            {title}
          </h2>
          <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-10">
            {locations?.map((loc, i) => (
              <button 
                key={i}
                className={`px-4 md:px-5 py-2 rounded-full border ${i === 0 ? 'border-tertiary bg-tertiary text-white' : 'border-outline-variant hover:border-tertiary transition-all'} font-label-sm text-label-sm`}
              >
                {loc.label}
              </button>
            ))}
          </div>
          <div className="space-y-6">
            {offices?.map((office, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-lg transition-all ${i === 0 ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5'}`}>
                <MapPin size={20} className="text-tertiary shrink-0" />
                <div>
                  <h4 className="font-body-md text-body-md font-bold">
                    {office.name}
                  </h4>
                  <p className="text-on-primary-container font-label-sm text-label-sm">
                    {office.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-8 h-[280px] sm:h-[360px] md:h-[480px] lg:h-[600px] rounded-xl md:rounded-2xl overflow-hidden relative border border-white/10">
          {typeof mapImage === 'object' && mapImage !== null && (
            <Media resource={mapImage} fill imgClassName="w-full h-full object-cover grayscale opacity-40" />
          )}
          
          {/* Custom Pins (Overlay) */}
          {pins?.map((pin, i) => (
            <div 
              key={i} 
              className="absolute group cursor-pointer"
              style={{ top: `${pin.topPercentage}%`, left: `${pin.leftPercentage}%` }}
            >
              <MapPin size={36} className={`text-tertiary ${pin.isPulsing ? 'animate-pulse' : ''}`} />
              {(pin.title || pin.subtitle) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white text-primary p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <p className="font-label-sm text-label-sm font-bold">{pin.title}</p>
                  <p className="text-[10px] text-secondary">{pin.subtitle}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
