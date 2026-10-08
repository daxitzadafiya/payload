'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Grid3x3, Pause, Play, X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  images: string[]
  title: string
  initialIndex?: number
}

const AUTO_SLIDE_MS = 4000
const TRANSITION_MS = 400
const ZOOM_SCALE = 2
const DRAG_THRESHOLD_RATIO = 0.12
const DRAG_CLICK_THRESHOLD = 5
const EDGE_DRAG_RESISTANCE = 0.35

const navArrowButtonClass =
  'absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/40 cursor-pointer disabled:opacity-60 sm:h-12 sm:w-12'

const transitionStyle = {
  transitionDuration: `${TRANSITION_MS}ms`,
  transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const

const scrollActiveThumbnailIntoView = (sidebar: HTMLElement | null) => {
  if (!sidebar) return

  const activeThumb = sidebar.querySelector<HTMLElement>('[data-active="true"]')
  if (!activeThumb) return

  const sidebarRect = sidebar.getBoundingClientRect()
  const thumbRect = activeThumb.getBoundingClientRect()
  const thumbCenterInSidebar =
    thumbRect.top - sidebarRect.top + sidebar.scrollTop + thumbRect.height / 2
  const idealScrollTop = thumbCenterInSidebar - sidebar.clientHeight / 2
  const maxScroll = sidebar.scrollHeight - sidebar.clientHeight

  sidebar.scrollTo({
    top: Math.max(0, Math.min(idealScrollTop, maxScroll)),
    behavior: 'smooth',
  })
}

export const PropertyDetailLightbox: React.FC<Props> = ({
  open,
  onClose,
  images,
  title,
  initialIndex = 0,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const thumbSidebarRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const dragOffsetRef = useRef(0)
  const activePointerIdRef = useRef<number | null>(null)
  const didDragRef = useRef(false)
  const autoSlideTimerRef = useRef<number | null>(null)

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [mounted, setMounted] = useState(false)

  const slideCount = images.length
  const hasMultiple = slideCount > 1

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveIndex(initialIndex)
    setIsTransitioning(false)
    setIsDragging(false)
    setDragOffsetPx(0)
    setIsZoomed(false)
    setIsAutoPlaying(false)
    setShowThumbnails(false)
    dragStartXRef.current = null
    dragOffsetRef.current = 0
    activePointerIdRef.current = null
    didDragRef.current = false
  }, [open, initialIndex])

  const clearAutoSlide = useCallback(() => {
    if (autoSlideTimerRef.current !== null) {
      window.clearInterval(autoSlideTimerRef.current)
      autoSlideTimerRef.current = null
    }
  }, [])

  const goTo = useCallback(
    (index: number) => {
      if (!hasMultiple || isTransitioning) return

      const nextIndex = ((index % slideCount) + slideCount) % slideCount
      if (nextIndex === activeIndex) return

      setIsZoomed(false)
      setIsTransitioning(true)
      setActiveIndex(nextIndex)
      window.setTimeout(() => setIsTransitioning(false), TRANSITION_MS)
    },
    [activeIndex, hasMultiple, isTransitioning, slideCount],
  )

  const goToNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goToPrevious = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  useEffect(() => {
    if (!open) {
      clearAutoSlide()
      return
    }

    if (!isAutoPlaying || !hasMultiple || isZoomed) {
      clearAutoSlide()
      return
    }

    autoSlideTimerRef.current = window.setInterval(() => {
      goToNext()
    }, AUTO_SLIDE_MS)

    return clearAutoSlide
  }, [clearAutoSlide, goToNext, hasMultiple, isAutoPlaying, isZoomed, open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false)
        } else {
          onClose()
        }
        return
      }

      if (isZoomed) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToPrevious()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToNext()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [goToNext, goToPrevious, isZoomed, onClose, open])

  useEffect(() => {
    if (!open || !showThumbnails) return

    let frame = 0
    let nestedFrame = 0

    frame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => {
        scrollActiveThumbnailIntoView(thumbSidebarRef.current)
      })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(nestedFrame)
    }
  }, [activeIndex, open, showThumbnails])

  const resetDrag = useCallback(() => {
    dragStartXRef.current = null
    activePointerIdRef.current = null
    dragOffsetRef.current = 0
    setDragOffsetPx(0)
    setIsDragging(false)
  }, [])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!hasMultiple || isTransitioning || isZoomed) return
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
    [hasMultiple, isTransitioning, isZoomed],
  )

  const handlePointerMove = useCallback(
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

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      const width = viewportRef.current?.clientWidth ?? 0
      const offset = dragOffsetRef.current
      const threshold = width * DRAG_THRESHOLD_RATIO

      resetDrag()

      if (width <= 0 || isZoomed) return

      if (offset < -threshold) {
        goToNext()
      } else if (offset > threshold) {
        goToPrevious()
      }
    },
    [goToNext, goToPrevious, isZoomed, resetDrag],
  )

  const handleImageClick = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }

    setIsZoomed((previous) => !previous)
    if (isAutoPlaying) {
      setIsAutoPlaying(false)
    }
  }, [isAutoPlaying])

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((previous) => !previous)
    setIsZoomed(false)
  }, [])

  const toggleThumbnails = useCallback(() => {
    setShowThumbnails((previous) => !previous)
  }, [])

  if (!open || !mounted || slideCount === 0) return null

  const mainTranslateX = `translateX(calc(-${activeIndex * 100}% + ${dragOffsetPx}px))`

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex h-[100dvh] bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image gallery`}
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          <span className="pointer-events-auto rounded-full bg-black/45 px-4 py-1.5 text-sm font-medium tabular-nums backdrop-blur-sm">
            {activeIndex + 1} / {slideCount}
          </span>

          <div className="pointer-events-auto flex items-center gap-1 md:gap-2">
            {hasMultiple && (
              <>
                <button
                  type="button"
                  aria-label={isAutoPlaying ? 'Pause slideshow' : 'Start slideshow'}
                  onClick={toggleAutoPlay}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  type="button"
                  aria-label={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
                  aria-pressed={showThumbnails}
                  onClick={toggleThumbnails}
                  className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-white/10 cursor-pointer ${
                    showThumbnails ? 'bg-white/15 text-white' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <Grid3x3 size={20} />
                </button>
              </>
            )}
            <button
              type="button"
              aria-label="Close gallery"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className={`relative min-h-0 flex-1 overflow-hidden ${
            isZoomed ? 'cursor-zoom-out' : hasMultiple && !isDragging ? 'cursor-grab' : ''
          } ${isDragging && !isZoomed ? 'cursor-grabbing select-none' : ''}`}
          style={hasMultiple && !isZoomed ? { touchAction: 'none' } : undefined}
          onPointerDown={hasMultiple && !isZoomed ? handlePointerDown : undefined}
          onPointerMove={hasMultiple && !isZoomed ? handlePointerMove : undefined}
          onPointerUp={hasMultiple && !isZoomed ? handlePointerEnd : undefined}
          onPointerCancel={hasMultiple && !isZoomed ? handlePointerEnd : undefined}
        >
          {hasMultiple ? (
            <div
              className={`flex h-full w-full ease-in-out ${isDragging ? '' : 'transition-transform'}`}
              style={{
                transform: mainTranslateX,
                ...(isDragging ? {} : transitionStyle),
              }}
            >
              {images.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className={`relative flex h-full w-full shrink-0 items-center justify-center ${
                    showThumbnails ? 'p-2 sm:p-4 md:p-8' : 'p-4 md:p-8'
                  }`}
                >
                  <button
                    type="button"
                    aria-label={isZoomed && index === activeIndex ? 'Zoom out' : 'Zoom in'}
                    onClick={index === activeIndex ? handleImageClick : undefined}
                    className={`relative max-h-full max-w-full border-0 bg-transparent p-0 ${
                      index === activeIndex
                        ? isZoomed
                          ? 'cursor-zoom-out'
                          : 'cursor-zoom-in'
                        : 'pointer-events-none'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${title} — image ${index + 1} of ${slideCount}`}
                      className="max-h-full max-w-full object-contain transition-transform ease-out"
                      style={{
                        transform:
                          index === activeIndex && isZoomed ? `scale(${ZOOM_SCALE})` : undefined,
                        transitionDuration: `${TRANSITION_MS}ms`,
                      }}
                      draggable={false}
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 md:p-8">
              <button
                type="button"
                aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
                onClick={handleImageClick}
                className={`relative max-h-full max-w-full border-0 bg-transparent p-0 ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[0]}
                  alt={title}
                  className="max-h-full max-w-full object-contain transition-transform ease-out"
                  style={{
                    transform: isZoomed ? `scale(${ZOOM_SCALE})` : undefined,
                    transitionDuration: `${TRANSITION_MS}ms`,
                  }}
                  draggable={false}
                />
              </button>
            </div>
          )}

          {hasMultiple && !isZoomed && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                disabled={isTransitioning}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={goToPrevious}
                className={`${navArrowButtonClass} left-2 sm:left-4`}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                disabled={isTransitioning}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={goToNext}
                className={`${navArrowButtonClass} ${
                  showThumbnails ? 'right-2 sm:right-3' : 'right-2 sm:right-4'
                }`}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {showThumbnails && hasMultiple && (
        <aside
          ref={thumbSidebarRef}
          className="lightbox-thumb-scroll h-full w-[5.5rem] shrink-0 overflow-y-auto border-l border-white/10 bg-black/50 py-3 pl-2 pr-1.5 sm:w-32 sm:py-4 sm:pl-3 sm:pr-2 md:w-44 lg:w-52"
          aria-label="Image thumbnails"
        >
          <div className="grid grid-cols-1 gap-2 pr-0.5 sm:grid-cols-2 sm:pr-1">
            {images.map((src, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={`thumb-${src}-${index}`}
                  type="button"
                  data-active={isActive ? 'true' : undefined}
                  aria-label={`Show image ${index + 1} of ${slideCount}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => goTo(index)}
                  className={`aspect-square overflow-hidden rounded border-[3px] p-0 transition-all cursor-pointer ${
                    isActive
                      ? 'border-tertiary opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="h-full w-full object-cover" src={src} loading="lazy" />
                </button>
              )
            })}
          </div>
        </aside>
      )}
    </div>,
    document.body,
  )
}
