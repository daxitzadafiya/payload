'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Media as PayloadMedia } from '@/payload-types'

import { Media } from '@/components/Media'
import { PropertyImagePlaceholder } from '@/components/PropertyImagePlaceholder'

type Props = {
  title: string
  imageResource?: PayloadMedia
  imageUrl?: string
  imageUrls?: string[]
  imgClassName?: string
  /** When set, clicking the image (not slider controls / drag) opens the detail page */
  href?: string
  /** Stash listing context before navigating to the detail page */
  onNavigate?: () => void
  /** Notifies parent (e.g. Properties block) to pause outer carousel auto-play */
  onInteract?: () => void
}

const TRANSITION_MS = 600
const TRANSITION_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const VIEWPORT_ROOT_MARGIN = '120px'
const DRAG_THRESHOLD_RATIO = 0.15
const EDGE_DRAG_RESISTANCE = 0.35
const FLICK_VELOCITY_THRESHOLD = 0.45
const DRAG_CLICK_THRESHOLD = 5

const transitionStyle = {
  transitionDuration: `${TRANSITION_MS}ms`,
  transitionTimingFunction: TRANSITION_EASING,
} as const

/** Matches original `gap-1.5` + `w-1.5` / `w-4` dot sizes (6px gap, 6px / 16px dots) */
const DOT_GAP_PX = 6
const INACTIVE_DOT_PX = 6
const ACTIVE_DOT_PX = 16
/** ~5 dots visible at the original tight spacing */
const DOT_VIEWPORT_MAX_PX = 68

const indicatorTransitionStyle = {
  transitionDuration: `${TRANSITION_MS}ms`,
  transitionTimingFunction: TRANSITION_EASING,
} as const

const getDotWidth = (index: number, activeIndex: number) =>
  index === activeIndex ? ACTIVE_DOT_PX : INACTIVE_DOT_PX

const getDotTrackWidth = (total: number, activeIndex: number) => {
  if (total <= 0) return 0

  let width = 0
  for (let index = 0; index < total; index++) {
    width += getDotWidth(index, activeIndex)
    if (index < total - 1) width += DOT_GAP_PX
  }
  return width
}

const getDotStripOffset = (activeIndex: number, total: number) => {
  if (total <= 1) return 0

  const trackWidth = getDotTrackWidth(total, activeIndex)
  const viewportWidth = Math.min(trackWidth, DOT_VIEWPORT_MAX_PX)
  if (trackWidth <= viewportWidth) return 0

  let offsetBefore = 0
  for (let index = 0; index < activeIndex; index++) {
    offsetBefore += getDotWidth(index, activeIndex) + DOT_GAP_PX
  }

  const activeCenter = offsetBefore + getDotWidth(activeIndex, activeIndex) / 2
  const idealOffset = activeCenter - viewportWidth / 2
  return Math.max(0, Math.min(idealOffset, trackWidth - viewportWidth))
}

/** Prefetch current + neighbors when the user moves the carousel */
const getAdjacentIndices = (index: number, total: number) => {
  if (total <= 1) return [index]
  return [index, (index + 1) % total, (index - 1 + total) % total]
}

const preloadImageUrl = (url: string) => {
  const image = new window.Image()
  image.src = url
}

type SlideIndicatorsProps = {
  activeIndex: number
  total: number
}

const PropertyCardSlideIndicators: React.FC<SlideIndicatorsProps> = ({ activeIndex, total }) => {
  const trackWidth = getDotTrackWidth(total, activeIndex)
  const viewportWidth = Math.min(trackWidth, DOT_VIEWPORT_MAX_PX)
  const offset = getDotStripOffset(activeIndex, total)

  return (
    <div
      className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm"
      aria-label={`Image ${activeIndex + 1} of ${total}`}
    >
      <div className="overflow-hidden" style={{ width: viewportWidth }}>
        <div
          className="flex items-center gap-1.5 transition-transform ease-in-out"
          style={{
            transform: `translateX(-${offset}px)`,
            ...indicatorTransitionStyle,
          }}
        >
          {Array.from({ length: total }, (_, index) => {
            const isActive = index === activeIndex
            return (
              <span
                key={index}
                className={`block h-1.5 shrink-0 rounded-full transition-all ease-in-out ${
                  isActive ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
                style={indicatorTransitionStyle}
                aria-hidden
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

const stopCardPointer = (event: React.SyntheticEvent) => {
  event.preventDefault()
  event.stopPropagation()
}

const GalleryPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`h-full w-full bg-surface-container-high ${className ?? ''}`.trim()}
    aria-hidden
  />
)

export const PropertyCardImageGallery: React.FC<Props> = ({
  title,
  imageResource,
  imageUrl,
  imageUrls,
  imgClassName = 'w-full h-full object-cover',
  href,
  onNavigate,
  onInteract,
}) => {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const dragOffsetRef = useRef(0)
  const activePointerIdRef = useRef<number | null>(null)
  const lastPointerMoveRef = useRef({ x: 0, time: 0 })
  const pointerVelocityRef = useRef(0)
  const pendingIndexRef = useRef<number | null>(null)
  const transitionTimeoutRef = useRef<number | null>(null)
  const didDragRef = useRef(false)

  const [isInView, setIsInView] = useState(false)
  const [slideWidth, setSlideWidth] = useState(0)

  const slides = useMemo(
    () => (imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []),
    [imageUrl, imageUrls],
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [loadedSlideIndices, setLoadedSlideIndices] = useState<Set<number>>(() => new Set())

  const hasMultiple = slides.length > 1
  const slideCount = slides.length

  useEffect(() => {
    const element = rootRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsInView(true)
      },
      { rootMargin: VIEWPORT_ROOT_MARGIN, threshold: 0.01 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = rootRef.current
    if (!element) return

    const updateWidth = () => {
      setSlideWidth(element.clientWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [slideCount])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setActiveIndex(0)
    setIsTransitioning(false)
    setIsDragging(false)
    setDragOffsetPx(0)
    dragOffsetRef.current = 0
    dragStartXRef.current = null
    activePointerIdRef.current = null
    pointerVelocityRef.current = 0
    pendingIndexRef.current = null
    didDragRef.current = false
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
    setLoadedSlideIndices(new Set())
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

  /** First paint in viewport: only the cover image (index 0) */
  useEffect(() => {
    if (!isInView || slideCount === 0) return
    ensureSlidesLoaded([0])
    const coverUrl = slides[0]
    if (coverUrl) preloadImageUrl(coverUrl)
  }, [ensureSlidesLoaded, isInView, slideCount, slides])

  /** After navigation: load current + next/prev only */
  useEffect(() => {
    if (!isInView || !hasMultiple || activeIndex === 0) return

    const indices = getAdjacentIndices(activeIndex, slideCount)
    ensureSlidesLoaded(indices)
    prefetchSlideUrls(indices)
  }, [activeIndex, ensureSlidesLoaded, hasMultiple, isInView, prefetchSlideUrls, slideCount])

  const finishTransition = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }

    const pendingIndex = pendingIndexRef.current
    if (pendingIndex !== null) {
      setActiveIndex(pendingIndex)
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

  const prepareSlide = useCallback(
    (nextIndex: number) => {
      const indices = getAdjacentIndices(nextIndex, slideCount)
      ensureSlidesLoaded(indices)
      prefetchSlideUrls(indices)
    },
    [ensureSlidesLoaded, prefetchSlideUrls, slideCount],
  )

  const goTo = useCallback(
    (index: number, event?: React.MouseEvent<HTMLButtonElement>) => {
      if (event) stopCardPointer(event)
      if (!hasMultiple || isTransitioning || !isInView) return

      onInteract?.()

      const nextIndex = ((index % slideCount) + slideCount) % slideCount
      if (nextIndex === activeIndex) return

      prepareSlide(nextIndex)
      pendingIndexRef.current = null
      startTransition()
      setActiveIndex(nextIndex)
    },
    [
      activeIndex,
      hasMultiple,
      isInView,
      isTransitioning,
      onInteract,
      prepareSlide,
      slideCount,
      startTransition,
    ],
  )

  const resetDrag = useCallback(() => {
    dragStartXRef.current = null
    activePointerIdRef.current = null
    pointerVelocityRef.current = 0
    dragOffsetRef.current = 0
    setDragOffsetPx(0)
    setIsDragging(false)
  }, [])

  const resolveDragTargetIndex = useCallback(
    (offset: number, velocity: number) => {
      if (slideWidth <= 0) return activeIndex

      const threshold = slideWidth * DRAG_THRESHOLD_RATIO
      let targetIndex = activeIndex

      if (offset < -threshold || velocity < -FLICK_VELOCITY_THRESHOLD) {
        targetIndex = activeIndex + 1
      } else if (offset > threshold || velocity > FLICK_VELOCITY_THRESHOLD) {
        targetIndex = activeIndex - 1
      }

      return ((targetIndex % slideCount) + slideCount) % slideCount
    },
    [activeIndex, slideCount, slideWidth],
  )

  const animateDragRelease = useCallback(
    (targetIndex: number, currentOffset: number) => {
      if (slideWidth <= 0) {
        resetDrag()
        return
      }

      if (targetIndex === activeIndex && Math.abs(currentOffset) < 1) {
        resetDrag()
        return
      }

      if (targetIndex !== activeIndex) {
        onInteract?.()
      }

      prepareSlide(targetIndex)

      pendingIndexRef.current = targetIndex
      const targetOffset = (activeIndex - targetIndex) * slideWidth

      dragStartXRef.current = null
      activePointerIdRef.current = null
      pointerVelocityRef.current = 0
      setIsDragging(false)

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          startTransition()
          dragOffsetRef.current = targetOffset
          setDragOffsetPx(targetOffset)
        })
      })
    },
    [activeIndex, onInteract, prepareSlide, resetDrag, slideWidth, startTransition],
  )

  const navigateToDetail = useCallback(() => {
    if (!href) return
    onNavigate?.()
    router.push(href)
  }, [href, onNavigate, router])

  const handleGalleryPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!hasMultiple || isTransitioning || !isInView) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if ((event.target as HTMLElement).closest('button')) return

      // Avoid preventDefault here so a tap still generates a click (detail navigation).
      // touch-action: none keeps the page from scrolling while swiping the slider.
      event.stopPropagation()

      onInteract?.()
      didDragRef.current = false

      dragStartXRef.current = event.clientX
      activePointerIdRef.current = event.pointerId
      pointerVelocityRef.current = 0
      lastPointerMoveRef.current = { x: event.clientX, time: performance.now() }
      dragOffsetRef.current = 0
      setDragOffsetPx(0)
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [hasMultiple, isInView, isTransitioning, onInteract],
  )

  const handleGalleryPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartXRef.current === null || activePointerIdRef.current !== event.pointerId) {
        return
      }

      event.stopPropagation()

      let delta = event.clientX - dragStartXRef.current

      if (Math.abs(delta) > DRAG_CLICK_THRESHOLD) {
        didDragRef.current = true
        event.preventDefault()
      }

      if (activeIndex === 0 && delta > 0) {
        delta *= EDGE_DRAG_RESISTANCE
      } else if (activeIndex === slideCount - 1 && delta < 0) {
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
    [activeIndex, slideCount],
  )

  const handleGalleryPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return

      event.stopPropagation()
      if (didDragRef.current) {
        event.preventDefault()
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      const offset = dragOffsetRef.current
      const velocity = pointerVelocityRef.current
      const targetIndex = resolveDragTargetIndex(offset, velocity)

      animateDragRelease(targetIndex, offset)
    },
    [animateDragRelease, resolveDragTargetIndex],
  )

  const handleGalleryClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('button')) return

      if (didDragRef.current) {
        event.preventDefault()
        event.stopPropagation()
        didDragRef.current = false
        return
      }

      if (!href) return

      event.preventDefault()
      event.stopPropagation()
      navigateToDetail()
    },
    [href, navigateToDetail],
  )

  const handleStaticImageClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!href) return
      if ((event.target as HTMLElement).closest('button')) return
      event.preventDefault()
      navigateToDetail()
    },
    [href, navigateToDetail],
  )

  const handleImageKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!href) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      navigateToDetail()
    },
    [href, navigateToDetail],
  )

  const detailLinkProps = href
    ? {
        role: 'link' as const,
        tabIndex: 0,
        onKeyDown: handleImageKeyDown,
        'aria-label': title,
      }
    : {}

  const handleTrackTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== 'transform') return
      finishTransition()
    },
    [finishTransition],
  )

  const goToPrevious = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      goTo(activeIndex - 1, event)
    },
    [activeIndex, goTo],
  )

  const goToNext = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      goTo(activeIndex + 1, event)
    },
    [activeIndex, goTo],
  )

  const wrapperClass = 'absolute inset-0'

  if (imageResource) {
    return (
      <div
        ref={rootRef}
        className={`${wrapperClass}${href ? ' cursor-pointer' : ''}`}
        onClick={handleStaticImageClick}
        {...detailLinkProps}
      >
        {isInView ? (
          <Media
            resource={imageResource}
            fill
            imgClassName={`${imgClassName} group-hover:scale-110 transition-transform duration-700`}
          />
        ) : (
          <GalleryPlaceholder />
        )}
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div
        ref={rootRef}
        className={`${wrapperClass}${href ? ' cursor-pointer' : ''}`}
        onClick={handleStaticImageClick}
        {...detailLinkProps}
      >
        <PropertyImagePlaceholder className="group-hover:scale-[1.02] transition-transform duration-700" />
      </div>
    )
  }

  if (!hasMultiple) {
    return (
      <div
        ref={rootRef}
        className={`${wrapperClass}${href ? ' cursor-pointer' : ''}`}
        onClick={handleStaticImageClick}
        {...detailLinkProps}
      >
        {isInView && loadedSlideIndices.has(0) ? (
          <img
            src={slides[0]}
            alt={title}
            className={`${imgClassName} group-hover:scale-110 transition-transform duration-700`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <GalleryPlaceholder />
        )}
      </div>
    )
  }

  // Percentage translate matches each slide's `w-full`; pixel offsets are only for drag/release.
  const translateX = `translateX(calc(-${activeIndex * 100}% + ${dragOffsetPx}px))`

  return (
    <div
      ref={rootRef}
      className={`${wrapperClass} overflow-hidden isolate ${
        isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
      }`}
      style={{ touchAction: 'none' }}
      onPointerDown={handleGalleryPointerDown}
      onPointerMove={handleGalleryPointerMove}
      onPointerUp={handleGalleryPointerEnd}
      onPointerCancel={handleGalleryPointerEnd}
      onClickCapture={handleGalleryClickCapture}
      {...detailLinkProps}
    >
      <div
        className={`flex h-full w-full ease-in-out ${isDragging ? '' : 'transition-transform'}`}
        style={{
          transform: translateX,
          ...(isDragging ? {} : transitionStyle),
        }}
        onTransitionEnd={handleTrackTransitionEnd}
      >
        {slides.map((src, index) => {
          const shouldRenderImage = isInView && loadedSlideIndices.has(index)
          return (
            <div key={`${src}-${index}`} className="relative h-full w-full shrink-0 overflow-hidden">
              {shouldRenderImage ? (
                <img
                  src={src}
                  alt={`${title} — image ${index + 1} of ${slides.length}`}
                  className={`${imgClassName} pointer-events-none min-w-full min-h-full`}
                  draggable={false}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 && activeIndex === 0 ? 'high' : 'low'}
                />
              ) : (
                <GalleryPlaceholder />
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        aria-label="Previous image"
        disabled={isTransitioning || !isInView}
        onMouseDown={stopCardPointer}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={goToPrevious}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center cursor-pointer hover:bg-black/55 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 disabled:opacity-60"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        aria-label="Next image"
        disabled={isTransitioning || !isInView}
        onMouseDown={stopCardPointer}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center cursor-pointer hover:bg-black/55 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 disabled:opacity-60"
      >
        <ChevronRight size={20} />
      </button>
      <PropertyCardSlideIndicators activeIndex={activeIndex} total={slideCount} />
    </div>
  )
}
