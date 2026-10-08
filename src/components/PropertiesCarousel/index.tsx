'use client'

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Media as PayloadMedia } from '@/payload-types'

import { PropertyCard, resolvePropertyCardStatusBadge } from '@/components/PropertyCard'
import { resolvePropertyDetailFetchStatuses } from '@/utilities/propertyDetailFetchStatus'
import { useReveal, activateRevealElements } from '@/utilities/useReveal'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

const CARDS_PER_VIEW_DESKTOP = 3
const CARDS_PER_VIEW_MOBILE = 1
const DESKTOP_MEDIA = '(min-width: 48rem)'
const GAP_PX = 24
const TRANSITION_MS = 600
const TRANSITION_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const DRAG_THRESHOLD_RATIO = 0.15
const EDGE_DRAG_RESISTANCE = 0.35
const FLICK_VELOCITY_THRESHOLD = 0.45
const DRAG_CLICK_THRESHOLD = 5

const carouselTransitionStyle = {
  transitionDuration: `${TRANSITION_MS}ms`,
  transitionTimingFunction: TRANSITION_EASING,
} as const

export type PropertiesCarouselItem = {
  id?: string
  imageResource?: PayloadMedia
  imageUrl?: string
  imageUrls?: string[]
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  crmStatus?: string
  location: string
  reference?: string
  displayReference?: string
  detailHref?: string
  title: string
  beds?: number
  baths?: number
  sqft?: number | string
  price: string
}

type Props = {
  subtitle?: string | null
  title: string
  properties: PropertiesCarouselItem[]
  loading?: boolean
  backgroundColor?: 'surface' | 'surface-container-low' | null
  showSoldBadge?: boolean
  useCrmStatus?: boolean
  emptyEyebrow?: string
  emptyTitle?: string
  emptyDescription?: string
  /** When true, keeps the section visible and shows SectionEmptyState if there are no listings. */
  showWhenEmpty?: boolean
  /** Fade/slide in content after loading (e.g. async similar properties on detail page). */
  animateEntry?: boolean
  className?: string
}

function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(() => {
    if (typeof window === 'undefined') return CARDS_PER_VIEW_DESKTOP
    return window.matchMedia(DESKTOP_MEDIA).matches ? CARDS_PER_VIEW_DESKTOP : CARDS_PER_VIEW_MOBILE
  })

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA)
    const update = () =>
      setCardsPerView(mq.matches ? CARDS_PER_VIEW_DESKTOP : CARDS_PER_VIEW_MOBILE)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return cardsPerView
}

const SKELETON_CARD_COUNT = CARDS_PER_VIEW_DESKTOP

import { PropertyCardSkeleton } from '@/components/PropertyCard/PropertyCardSkeleton'

export const PropertiesCarousel: React.FC<Props> = ({
  subtitle,
  title,
  properties,
  loading = false,
  backgroundColor = 'surface',
  showSoldBadge,
  useCrmStatus = true,
  emptyEyebrow,
  emptyTitle,
  emptyDescription,
  showWhenEmpty = false,
  animateEntry = false,
  className,
}) => {
  const sectionRef = useReveal<HTMLElement>()
  const defaultEmptyEyebrow = useTranslation('propertiesCarousel.empty.eyebrow', 'Listings')
  const defaultEmptyTitle = useTranslation(
    'propertiesCarousel.empty.title',
    'No properties found',
  )
  const defaultEmptyDescription = useTranslation(
    'propertiesCarousel.empty.description',
    'We could not find any listings for this selection. Try another filter or check again soon.',
  )
  const resolvedEmptyEyebrow = emptyEyebrow ?? defaultEmptyEyebrow
  const resolvedEmptyTitle = emptyTitle ?? defaultEmptyTitle
  const resolvedEmptyDescription = emptyDescription ?? defaultEmptyDescription
  const [entryRevealed, setEntryRevealed] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const dragOffsetRef = useRef(0)
  const activePointerIdRef = useRef<number | null>(null)
  const lastPointerMoveRef = useRef({ x: 0, time: 0 })
  const pointerVelocityRef = useRef(0)
  const pendingIndexRef = useRef<number | null>(null)
  const transitionTimeoutRef = useRef<number | null>(null)
  const didDragRef = useRef(false)
  const isCarouselDraggingRef = useRef(false)

  const cardsPerView = useCardsPerView()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [slideStride, setSlideStride] = useState(0)

  const displayProperties = properties
  const bgClass =
    backgroundColor === 'surface-container-low' ? 'bg-surface-container-low' : 'bg-surface'
  const cardVariant =
    backgroundColor === 'surface-container-low' ? 'surface-container-low' : 'surface'

  const total = displayProperties.length
  const maxIndex = Math.max(0, total - cardsPerView)

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex))
    dragOffsetRef.current = 0
    setDragOffsetPx(0)
    setIsDragging(false)
    isCarouselDraggingRef.current = false
  }, [maxIndex, properties.length])

  const measureSlideStride = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const cards = track.children
    if (cards.length >= 2) {
      const stride = (cards[1] as HTMLElement).offsetLeft
      if (stride > 0) setSlideStride(stride)
      return
    }

    if (cards.length === 1) {
      const card = cards[0] as HTMLElement
      const stride = card.getBoundingClientRect().width + GAP_PX
      if (stride > 0) setSlideStride(stride)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const finishTransition = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }

    const pendingIndex = pendingIndexRef.current
    if (pendingIndex !== null) {
      setCurrentIndex(pendingIndex)
      pendingIndexRef.current = null
    }

    dragOffsetRef.current = 0
    setDragOffsetPx(0)
    setIsTransitioning(false)
  }, [])

  const startTransition = useCallback(() => {
    setIsTransitioning(true)

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current)
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      finishTransition()
    }, TRANSITION_MS + 50)
  }, [finishTransition])

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return

      const nextIndex = Math.max(0, Math.min(maxIndex, index))
      pendingIndexRef.current = null
      dragOffsetRef.current = 0
      setDragOffsetPx(0)
      startTransition()
      setCurrentIndex(nextIndex)
    },
    [isTransitioning, maxIndex, startTransition],
  )

  const handlePrev = useCallback(() => {
    goTo(currentIndex <= 0 ? maxIndex : currentIndex - 1)
  }, [currentIndex, maxIndex, goTo])

  const handleNext = useCallback(() => {
    goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1)
  }, [currentIndex, maxIndex, goTo])

  const canSlide = total > cardsPerView

  const getLiveSlideStride = useCallback(() => {
    const track = trackRef.current
    if (track && track.children.length >= 2) {
      return (track.children[1] as HTMLElement).offsetLeft
    }
    return slideStride
  }, [slideStride])

  const resolveDragTargetIndex = useCallback(
    (offset: number, velocity: number) => {
      const stride = getLiveSlideStride()
      if (stride <= 0) return currentIndex

      const threshold = stride * DRAG_THRESHOLD_RATIO
      let targetIndex = currentIndex

      if (offset < -threshold || velocity < -FLICK_VELOCITY_THRESHOLD) {
        targetIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1
      } else if (offset > threshold || velocity > FLICK_VELOCITY_THRESHOLD) {
        targetIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1
      }

      return targetIndex
    },
    [currentIndex, getLiveSlideStride, maxIndex],
  )

  const resetDrag = useCallback(() => {
    dragStartXRef.current = null
    activePointerIdRef.current = null
    pointerVelocityRef.current = 0
    dragOffsetRef.current = 0
    setDragOffsetPx(0)
    setIsDragging(false)
    isCarouselDraggingRef.current = false
  }, [])

  const animateDragRelease = useCallback(
    (targetIndex: number, currentOffset: number) => {
      const stride = getLiveSlideStride()
      if (stride <= 0) {
        resetDrag()
        return
      }

      if (targetIndex === currentIndex && Math.abs(currentOffset) < 1) {
        resetDrag()
        return
      }

      pendingIndexRef.current = targetIndex
      const targetOffset = (currentIndex - targetIndex) * stride

      dragStartXRef.current = null
      activePointerIdRef.current = null
      pointerVelocityRef.current = 0
      setIsDragging(false)
      isCarouselDraggingRef.current = false

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          startTransition()
          dragOffsetRef.current = targetOffset
          setDragOffsetPx(targetOffset)
        })
      })
    },
    [currentIndex, getLiveSlideStride, resetDrag, startTransition],
  )

  const handleCarouselPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canSlide || isTransitioning) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if ((event.target as HTMLElement).closest('button')) return

      didDragRef.current = false
      dragStartXRef.current = event.clientX
      activePointerIdRef.current = event.pointerId
      pointerVelocityRef.current = 0
      lastPointerMoveRef.current = { x: event.clientX, time: performance.now() }
      dragOffsetRef.current = 0
      setDragOffsetPx(0)
    },
    [canSlide, isTransitioning],
  )

  const handleCarouselPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartXRef.current === null || activePointerIdRef.current !== event.pointerId) {
        return
      }

      let delta = event.clientX - dragStartXRef.current

      if (!isDragging) {
        if (Math.abs(delta) <= DRAG_CLICK_THRESHOLD) return

        didDragRef.current = true
        isCarouselDraggingRef.current = true
        setIsDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
      }

      event.preventDefault()

      if (currentIndex === 0 && delta > 0) {
        delta *= EDGE_DRAG_RESISTANCE
      } else if (currentIndex === maxIndex && delta < 0) {
        delta *= EDGE_DRAG_RESISTANCE
      }

      const now = performance.now()
      const elapsed = now - lastPointerMoveRef.current.time
      if (elapsed > 0) {
        pointerVelocityRef.current = (event.clientX - lastPointerMoveRef.current.x) / elapsed
      }
      lastPointerMoveRef.current = { x: event.clientX, time: now }

      dragOffsetRef.current = delta
      setDragOffsetPx(delta)
    },
    [currentIndex, isDragging, maxIndex],
  )

  const handleCarouselPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      if (!isCarouselDraggingRef.current) {
        dragStartXRef.current = null
        activePointerIdRef.current = null
        pointerVelocityRef.current = 0
        return
      }

      event.preventDefault()

      const offset = dragOffsetRef.current
      const velocity = pointerVelocityRef.current
      const targetIndex = resolveDragTargetIndex(offset, velocity)

      animateDragRelease(targetIndex, offset)
    },
    [animateDragRelease, resolveDragTargetIndex],
  )

  const handleCarouselClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!didDragRef.current) return

    event.preventDefault()
    event.stopPropagation()
    didDragRef.current = false
  }, [])

  const handleTrackTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== 'transform') return
      finishTransition()
    },
    [finishTransition],
  )

  const hasProperties = total > 0
  const showLoading = loading

  useEffect(() => {
    if (!animateEntry) return

    if (!showLoading && hasProperties) {
      setEntryRevealed(false)
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntryRevealed(true))
      })
      return () => cancelAnimationFrame(frameId)
    }

    setEntryRevealed(false)
  }, [animateEntry, showLoading, hasProperties, properties.length])

  const revealClass = () => {
    if (showLoading) return ''
    if (animateEntry) return entryRevealed ? 'reveal active' : 'reveal'
    return 'reveal active'
  }

  useLayoutEffect(() => {
    if (!hasProperties || showLoading) return
    measureSlideStride()
    if (!animateEntry) {
      activateRevealElements(carouselRef.current)
      activateRevealElements(sectionRef.current)
    }
  }, [animateEntry, hasProperties, showLoading, properties.length, measureSlideStride, cardsPerView])

  useEffect(() => {
    const track = trackRef.current
    const viewport = carouselRef.current
    if (!track) return

    measureSlideStride()

    const observer = new ResizeObserver(() => {
      measureSlideStride()
    })

    observer.observe(track)
    if (viewport) observer.observe(viewport)
    return () => observer.disconnect()
  }, [measureSlideStride, total, cardsPerView, hasProperties, showLoading])

  if (!showLoading && !hasProperties && !showWhenEmpty) return null

  // Always size cards for the full carousel viewport (3-up desktop / 1-up mobile),
  // even when fewer listings are returned — matches Featured Properties layout.
  const cardWidth = `calc((100cqw - ${GAP_PX * (cardsPerView - 1)}px) / ${cardsPerView})`
  const trackTranslateX = `translateX(calc(-1 * ${currentIndex} * (100cqw + ${GAP_PX}px) / ${cardsPerView} + ${dragOffsetPx}px))`

  return (
    <section ref={sectionRef} className={cn(`py-16 md:py-24 ${bgClass}`, className)}>
      <div
        className={cn(
          'max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-8 md:mb-12 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end',
          revealClass(),
        )}
      >
        <div>
          {subtitle && (
            <span className="mb-3 block font-label-nav text-[11px] uppercase tracking-[0.2em] text-secondary md:text-[12px]">
              {subtitle}
            </span>
          )}
          <span className="mb-3 block h-px w-12 bg-secondary" aria-hidden />
          <h2 className="font-headline-md text-headline-md font-light tracking-[0.01em] text-primary md:font-headline-lg md:text-headline-lg">
            {title}
          </h2>
        </div>
        {hasProperties && !showLoading && canSlide && (
          <div className="flex gap-3 md:gap-4 shrink-0">
            <button
              type="button"
              aria-label="Previous properties"
              disabled={isTransitioning}
              onClick={handlePrev}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest transition-all hover:border-secondary hover:bg-secondary hover:text-on-secondary disabled:opacity-60 md:h-12 md:w-12"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next properties"
              disabled={isTransitioning}
              onClick={handleNext}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest transition-all hover:border-secondary hover:bg-secondary hover:text-on-secondary disabled:opacity-60 md:h-12 md:w-12"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {showLoading ? (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
              <PropertyCardSkeleton key={i} className={cn(i > 0 && 'hidden md:block')} />
            ))}
          </div>
        </div>
      ) : hasProperties ? (
        <div
          ref={carouselRef}
          className={cn(
            '@container max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12 overflow-hidden',
            revealClass(),
            canSlide && (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'),
          )}
          style={canSlide ? { touchAction: 'none', overscrollBehaviorX: 'contain' } : undefined}
          onPointerDown={canSlide ? handleCarouselPointerDown : undefined}
          onPointerMove={canSlide ? handleCarouselPointerMove : undefined}
          onPointerUp={canSlide ? handleCarouselPointerEnd : undefined}
          onPointerCancel={canSlide ? handleCarouselPointerEnd : undefined}
          onClickCapture={canSlide ? handleCarouselClickCapture : undefined}
        >
          <div
            ref={trackRef}
            className={cn('flex ease-in-out', isDragging ? '' : 'transition-transform')}
            style={{
              gap: `${GAP_PX}px`,
              transform: trackTranslateX,
              ...(isDragging ? {} : carouselTransitionStyle),
            }}
            onTransitionEnd={handleTrackTransitionEnd}
          >
            {displayProperties.map((property, idx) => {
              const cardKey = property.id ?? property.reference ?? String(idx)
              return (
                <PropertyCard
                  key={cardKey}
                  propertyId={property.id}
                  href={property.detailHref}
                  property={property}
                  statusBadgeLabel={resolvePropertyCardStatusBadge({
                    statusBadgeLabel: property.statusBadgeLabel,
                    showSoldBadge: Boolean(showSoldBadge),
                    useCrmStatus,
                  })}
                  detailFetchStatuses={resolvePropertyDetailFetchStatuses({
                    crmStatus: property.crmStatus,
                    statusBadgeLabel: property.statusBadgeLabel,
                    forceSold: Boolean(showSoldBadge),
                  })}
                  variant={cardVariant}
                  className="shrink-0"
                  style={{ width: cardWidth }}
                />
              )
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12 reveal active">
          <SectionEmptyState
            eyebrow={resolvedEmptyEyebrow}
            title={resolvedEmptyTitle}
            description={resolvedEmptyDescription}
            tone={backgroundColor === 'surface-container-low' ? 'muted' : 'surface'}
          />
        </div>
      )}

      {total > cardsPerView && (
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              type="button"
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              disabled={isTransitioning}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer disabled:opacity-60 ${
                i === currentIndex ? 'w-8 bg-tertiary' : 'w-2 bg-outline-variant'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
