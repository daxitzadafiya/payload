'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Quote } from 'lucide-react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'testimonialsBlock' }>

const FADE_MS = 600

export const TestimonialsBlock: React.FC<Props> = ({ testimonials }) => {
  const sectionRef = useReveal()
  const total = testimonials?.length ?? 0
  const [activeIndex, setActiveIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const activeIndexRef = useRef(0)
  const isTransitioningRef = useRef(false)
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  activeIndexRef.current = activeIndex

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (total <= 0 || isTransitioningRef.current) return
      const normalized = ((nextIndex % total) + total) % total
      if (normalized === activeIndexRef.current) return

      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
      isTransitioningRef.current = true

      setIsVisible(false)
      fadeTimeoutRef.current = setTimeout(() => {
        setActiveIndex(normalized)
        activeIndexRef.current = normalized
        requestAnimationFrame(() => {
          setIsVisible(true)
          isTransitioningRef.current = false
        })
      }, FADE_MS)
    },
    [total],
  )

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    }
  }, [])

  const current = testimonials?.[activeIndex]

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-surface-container-low reveal">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center">
        <Quote
          size={60}
          fill="currentColor"
          className="text-tertiary mb-6 md:mb-8 mx-auto block opacity-70"
        />

        <div className="relative min-h-[200px] md:min-h-[180px] flex flex-col items-center justify-center">
          {current && (
            <div
              className={cn(
                'w-full transition-all ease-in-out',
                isVisible
                  ? 'opacity-100 translate-y-0 duration-600'
                  : 'opacity-0 translate-y-4 duration-500 pointer-events-none',
              )}
              aria-live="polite"
            >
              <blockquote className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary italic leading-relaxed max-w-4xl mx-auto mb-8">
                &ldquo;{current.quote}&rdquo;
              </blockquote>
              <p className="font-label-nav text-label-nav text-primary font-bold uppercase tracking-widest">
                {current.authorName}
              </p>
              {current.authorRole && (
                <p className="font-label-sm text-label-sm text-secondary mt-2">
                  {current.authorRole}
                </p>
              )}
            </div>
          )}
        </div>

        {total > 1 && (
          <div className="flex justify-center gap-2 mt-6 md:mt-8">
            {testimonials?.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToIndex(i)}
                aria-label={`View testimonial ${i + 1}`}
                aria-current={i === activeIndex ? 'true' : undefined}
                className={cn(
                  'h-2 rounded-full transition-all duration-500 cursor-pointer',
                  i === activeIndex
                    ? 'w-8 bg-tertiary'
                    : 'w-2 bg-outline-variant hover:bg-tertiary/50',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
