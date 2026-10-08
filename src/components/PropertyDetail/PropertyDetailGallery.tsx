'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'

import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import { PropertyDetailLightbox } from '@/components/PropertyDetail/PropertyDetailLightbox'

type Props = {
  images: string[]
  title: string
  badgeLabel?: string
}

const TRANSITION_MS = 600
const TRANSITION_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const THUMBNAILS_VISIBLE = 7
const THUMB_GAP_PX = 12
const THUMB_GAPS_TOTAL_PX = THUMB_GAP_PX * (THUMBNAILS_VISIBLE - 1)
const THUMB_SIZE_CSS = `calc((100% - ${THUMB_GAPS_TOTAL_PX}px) / ${THUMBNAILS_VISIBLE})`

const computeThumbWidth = (viewportWidth: number) =>
  viewportWidth > 0 ? Math.max(0, (viewportWidth - THUMB_GAPS_TOTAL_PX) / THUMBNAILS_VISIBLE) : 0
const DRAG_THRESHOLD_RATIO = 0.15
const DRAG_CLICK_THRESHOLD = 5
const EDGE_DRAG_RESISTANCE = 0.35

const transitionStyle = {
  transitionDuration: `${TRANSITION_MS}ms`,
  transitionTimingFunction: TRANSITION_EASING,
} as const

const getAdjacentIndices = (index: number, total: number) => {
  if (total <= 1) return [index]
  return [index, (index + 1) % total, (index - 1 + total) % total]
}

const preloadImageUrl = (url: string) => {
  const image = new window.Image()
  image.src = url
}

const getThumbStripOffset = ({
  activeIndex,
  total,
  thumbWidth,
  viewportWidth,
}: {
  activeIndex: number
  total: number
  thumbWidth: number
  viewportWidth: number
}) => {
  if (total <= THUMBNAILS_VISIBLE || thumbWidth <= 0 || viewportWidth <= 0) return 0

  const thumbStride = thumbWidth + THUMB_GAP_PX
  const trackWidth = total * thumbWidth + (total - 1) * THUMB_GAP_PX
  const offsetBefore = activeIndex * thumbStride
  const activeCenter = offsetBefore + thumbWidth / 2
  const idealOffset = activeCenter - viewportWidth / 2

  return Math.max(0, Math.min(idealOffset, trackWidth - viewportWidth))
}

export const PropertyDetailGallery: React.FC<Props> = ({ images, title, badgeLabel }) => {
  const slides = useMemo(
    () => (images.length > 0 ? images : ['/placeholder-property.png']),
    [images],
  )

  const thumbViewportRef = useRef<HTMLDivElement>(null)
  const mainViewportRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const dragOffsetRef = useRef(0)
  const activePointerIdRef = useRef<number | null>(null)
  const didDragRef = useRef(false)

  const [viewportWidth, setViewportWidth] = useState(0)
  const thumbWidth = computeThumbWidth(viewportWidth)

  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [loadedSlideIndices, setLoadedSlideIndices] = useState<Set<number>>(() => new Set([0]))
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0)

  const hasMultiple = slides.length > 1
  const slideCount = slides.length
  const needsThumbSlider = slideCount > THUMBNAILS_VISIBLE

  const thumbStripOffset = useMemo(
    () =>
      getThumbStripOffset({
        activeIndex,
        total: slideCount,
        thumbWidth,
        viewportWidth,
      }),
    [activeIndex, slideCount, thumbWidth, viewportWidth],
  )

  useLayoutEffect(() => {
    const thumbElement = thumbViewportRef.current
    const mainElement = mainViewportRef.current
    if (!thumbElement && !mainElement) return

    const updateMeasurements = () => {
      const measuredViewport = thumbElement?.clientWidth || mainElement?.clientWidth || 0
      setViewportWidth(measuredViewport)
    }

    updateMeasurements()

    const observer = new ResizeObserver(updateMeasurements)
    if (thumbElement) observer.observe(thumbElement)
    if (mainElement) observer.observe(mainElement)
    return () => observer.disconnect()
  }, [slideCount, hasMultiple])

  useEffect(() => {
    setActiveIndex(0)
    setIsTransitioning(false)
    setIsDragging(false)
    setDragOffsetPx(0)
    dragOffsetRef.current = 0
    dragStartXRef.current = null
    activePointerIdRef.current = null
    didDragRef.current = false
    setLoadedSlideIndices(new Set([0]))
    setLightboxOpen(false)
  }, [slides])

  const ensureSlidesLoaded = useCallback(
    (indices: number[]) => {
      setLoadedSlideIndices((previous) => {
        let changed = false
        const next = new Set(previous)
        indices.forEach((index) => {
          if (index >= 0 && index < slideCount && !next.has(index)) {
            next.add(index)
            changed = true
          }
        })
        return changed ? next : previous
      })
    },
    [slideCount],
  )

  const prefetchSlideUrls = useCallback(
    (indices: number[]) => {
      indices.forEach((index) => {
        const url = slides[index]
        if (url) preloadImageUrl(url)
      })
    },
    [slides],
  )

  useEffect(() => {
    if (!hasMultiple || activeIndex === 0) return
    const indices = getAdjacentIndices(activeIndex, slideCount)
    ensureSlidesLoaded(indices)
    prefetchSlideUrls(indices)
  }, [activeIndex, ensureSlidesLoaded, hasMultiple, prefetchSlideUrls, slideCount])

  const goTo = useCallback(
    (index: number) => {
      if (!hasMultiple || isTransitioning) return

      const nextIndex = ((index % slideCount) + slideCount) % slideCount
      if (nextIndex === activeIndex) return

      const indices = getAdjacentIndices(nextIndex, slideCount)
      ensureSlidesLoaded(indices)
      prefetchSlideUrls(indices)
      setIsTransitioning(true)
      setActiveIndex(nextIndex)
      window.setTimeout(() => setIsTransitioning(false), TRANSITION_MS)
    },
    [activeIndex, ensureSlidesLoaded, hasMultiple, isTransitioning, prefetchSlideUrls, slideCount],
  )

  const resetDrag = useCallback(() => {
    dragStartXRef.current = null
    activePointerIdRef.current = null
    dragOffsetRef.current = 0
    setDragOffsetPx(0)
    setIsDragging(false)
  }, [])

  const openLightbox = useCallback((index: number) => {
    setLightboxInitialIndex(index)
    setLightboxOpen(true)
  }, [])

  const handleMainPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!hasMultiple || isTransitioning) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if ((event.target as HTMLElement).closest('button')) return

      didDragRef.current = false
      dragStartXRef.current = event.clientX
      activePointerIdRef.current = event.pointerId
      dragOffsetRef.current = 0
      setDragOffsetPx(0)
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [hasMultiple, isTransitioning],
  )

  const handleMainPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        !isDragging ||
        dragStartXRef.current === null ||
        activePointerIdRef.current !== event.pointerId
      ) {
        return
      }

      let delta = event.clientX - dragStartXRef.current

      if (Math.abs(delta) > DRAG_CLICK_THRESHOLD) {
        didDragRef.current = true
      }

      if (activeIndex === 0 && delta > 0) {
        delta *= EDGE_DRAG_RESISTANCE
      } else if (activeIndex === slideCount - 1 && delta < 0) {
        delta *= EDGE_DRAG_RESISTANCE
      }

      dragOffsetRef.current = delta
      setDragOffsetPx(delta)
    },
    [activeIndex, isDragging, slideCount],
  )

  const handleMainPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      const width = mainViewportRef.current?.clientWidth ?? 0
      const offset = dragOffsetRef.current
      const threshold = width * DRAG_THRESHOLD_RATIO

      resetDrag()

      if (width <= 0) return

      if (offset < -threshold) {
        goTo(activeIndex + 1)
      } else if (offset > threshold) {
        goTo(activeIndex - 1)
      }
    },
    [activeIndex, goTo, resetDrag],
  )

  const handleMainClick = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    openLightbox(activeIndex)
  }, [activeIndex, openLightbox])

  const mainTranslateX = `translateX(calc(-${activeIndex * 100}% + ${dragOffsetPx}px))`

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="relative">
        <div
          className="pointer-events-none absolute -right-2 -top-2 h-[94%] w-[94%] rounded-[1.5rem] border border-secondary/35 md:-right-3 md:-top-3 md:rounded-[1.75rem]"
          aria-hidden
        />
        <div
          ref={mainViewportRef}
          className={`group/main relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-surface-sand shadow-[0_28px_60px_-32px_rgba(0,0,0,0.35)] md:rounded-[1.75rem] lg:aspect-[3/2] ${
            hasMultiple
              ? isDragging
                ? 'cursor-grabbing select-none'
                : 'cursor-grab'
              : 'cursor-pointer'
          }`}
          style={hasMultiple ? { touchAction: 'none' } : undefined}
          onPointerDown={hasMultiple ? handleMainPointerDown : undefined}
          onPointerMove={hasMultiple ? handleMainPointerMove : undefined}
          onPointerUp={hasMultiple ? handleMainPointerEnd : undefined}
          onPointerCancel={hasMultiple ? handleMainPointerEnd : undefined}
          onClick={hasMultiple ? handleMainClick : () => openLightbox(0)}
          role="button"
          tabIndex={0}
          aria-label="Open full screen gallery"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openLightbox(activeIndex)
            }
          }}
        >
        {hasMultiple ? (
          <div
            className={`flex h-full w-full ease-in-out ${isDragging ? '' : 'transition-transform'}`}
            style={{
              transform: mainTranslateX,
              ...(isDragging ? {} : transitionStyle),
            }}
          >
            {slides.map((src, index) => (
              <div key={`${src}-${index}`} className="relative h-full w-full shrink-0">
                {loadedSlideIndices.has(index) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`${title} — image ${index + 1} of ${slides.length}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={index === 0 && activeIndex === 0 ? 'high' : 'low'}
                  />
                ) : (
                  <div
                    className="h-full w-full bg-surface-container-high animate-pulse"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={title}
            className="w-full h-full object-cover"
            src={slides[0]}
            loading="eager"
            decoding="async"
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              disabled={isTransitioning}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                goTo(activeIndex - 1)
              }}
              className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-secondary/40 bg-surface-container-lowest/90 text-primary shadow-sm backdrop-blur-md transition-all hover:border-secondary hover:bg-secondary hover:text-on-secondary disabled:opacity-60"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              disabled={isTransitioning}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                goTo(activeIndex + 1)
              }}
              className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-secondary/40 bg-surface-container-lowest/90 text-primary shadow-sm backdrop-blur-md transition-all hover:border-secondary hover:bg-secondary hover:text-on-secondary disabled:opacity-60"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="Open full screen gallery"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            openLightbox(activeIndex)
          }}
          className="absolute bottom-4 right-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-secondary/35 bg-primary/80 text-on-primary opacity-100 backdrop-blur-md transition-all hover:bg-secondary hover:text-on-secondary focus:opacity-100 md:opacity-0 md:group-hover/main:opacity-100"
        >
          <Expand size={18} />
        </button>

        {badgeLabel && (
          <div className="absolute top-4 left-4 z-20 md:top-5 md:left-5">
            <span className="rounded-md bg-primary/90 px-3.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.16em] text-on-primary backdrop-blur-md">
              {badgeLabel}
            </span>
          </div>
        )}

        <GoldCornerTicks />
        </div>
      </div>

      <PropertyDetailLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={slides}
        title={title}
        initialIndex={lightboxInitialIndex}
      />

      {hasMultiple && (
        <div
          ref={thumbViewportRef}
          className="overflow-hidden"
          aria-label="Property image thumbnails"
          style={{ '--thumb-size': THUMB_SIZE_CSS } as React.CSSProperties}
        >
          <div
            className={`flex gap-3 justify-start ease-in-out ${needsThumbSlider ? 'transition-transform' : ''}`}
            style={
              needsThumbSlider
                ? {
                    transform: `translateX(-${thumbStripOffset}px)`,
                    ...transitionStyle,
                  }
                : undefined
            }
          >
            {slides.map((src, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  aria-label={`Show image ${index + 1} of ${slides.length}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => goTo(index)}
                  className={`aspect-square shrink-0 cursor-pointer rounded-md border-[2px] p-0 box-border transition-all ease-in-out ${
                    isActive
                      ? 'border-secondary opacity-100'
                      : 'border-transparent opacity-55 hover:opacity-100'
                  }`}
                  style={{
                    width: 'var(--thumb-size)',
                    ...transitionStyle,
                  }}
                >
                  <span className="block h-full w-full overflow-hidden rounded-[2px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      src={src}
                      loading="eager"
                      decoding="async"
                    />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
