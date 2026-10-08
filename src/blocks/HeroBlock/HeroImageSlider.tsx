'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Media as PayloadMedia } from '@/payload-types'

import { Media } from '@/components/Media'

type Slide = {
  id?: string | null
  image: number | PayloadMedia
}

type Props = {
  slides: Slide[]
  autoplay?: boolean | null
  intervalSeconds?: number | null
  priority?: boolean
}

const TRANSITION_MS = 700
const TRANSITION_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const DRAG_THRESHOLD_RATIO = 0.12
const EDGE_DRAG_RESISTANCE = 0.35
const FLICK_VELOCITY_THRESHOLD = 0.45

const transitionStyle = {
  transitionDuration: `${TRANSITION_MS}ms`,
  transitionTimingFunction: TRANSITION_EASING,
} as const

const getAdjacentIndices = (index: number, total: number) => {
  if (total <= 1) return [index]
  return [index, (index + 1) % total, (index - 1 + total) % total]
}

export const HeroImageSlider: React.FC<Props> = ({
  slides,
  autoplay = true,
  intervalSeconds = 5,
  priority = true,
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const dragOffsetRef = useRef(0)
  const activePointerIdRef = useRef<number | null>(null)
  const lastPointerMoveRef = useRef({ x: 0, time: 0 })
  const pointerVelocityRef = useRef(0)
  const autoplayTimerRef = useRef<number | null>(null)
  const transitionTimeoutRef = useRef<number | null>(null)
  const didDragRef = useRef(false)

  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffsetPx, setDragOffsetPx] = useState(0)
  const [loadedSlideIndices, setLoadedSlideIndices] = useState<Set<number>>(() => new Set())
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const slideCount = slides.length
  const hasMultiple = slideCount > 1
  const intervalMs = Math.max(2000, Math.min(15000, (intervalSeconds ?? 5) * 1000))

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current !== null) window.clearInterval(autoplayTimerRef.current)
      if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    setActiveIndex(0)
    setIsTransitioning(false)
    setIsDragging(false)
    setDragOffsetPx(0)
    dragOffsetRef.current = 0
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

  useEffect(() => {
    if (slideCount === 0) return
    ensureSlidesLoaded([0])
  }, [ensureSlidesLoaded, slideCount])

  useEffect(() => {
    if (!hasMultiple || activeIndex === 0) return
    ensureSlidesLoaded(getAdjacentIndices(activeIndex, slideCount))
  }, [activeIndex, ensureSlidesLoaded, hasMultiple, slideCount])

  const finishTransition = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
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
    transitionTimeoutRef.current = window.setTimeout(finishTransition, TRANSITION_MS + 50)
  }, [finishTransition])

  const goTo = useCallback(
    (index: number) => {
      if (!hasMultiple || isTransitioning) return
      const nextIndex = ((index % slideCount) + slideCount) % slideCount
      if (nextIndex === activeIndex) return
      ensureSlidesLoaded(getAdjacentIndices(nextIndex, slideCount))
      startTransition()
      setActiveIndex(nextIndex)
    },
    [activeIndex, ensureSlidesLoaded, hasMultiple, isTransitioning, slideCount, startTransition],
  )

  const goToNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goToPrevious = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  const resetAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      window.clearInterval(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }

    if (!hasMultiple || autoplay === false || prefersReducedMotion) return

    autoplayTimerRef.current = window.setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % slideCount
        ensureSlidesLoaded(getAdjacentIndices(nextIndex, slideCount))
        startTransition()
        return nextIndex
      })
    }, intervalMs)
  }, [
    autoplay,
    ensureSlidesLoaded,
    hasMultiple,
    intervalMs,
    prefersReducedMotion,
    slideCount,
    startTransition,
  ])

  useEffect(() => {
    resetAutoplayTimer()
    return () => {
      if (autoplayTimerRef.current !== null) window.clearInterval(autoplayTimerRef.current)
    }
  }, [resetAutoplayTimer])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple || isTransitioning) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    activePointerIdRef.current = event.pointerId
    dragStartXRef.current = event.clientX
    dragOffsetRef.current = 0
    pointerVelocityRef.current = 0
    lastPointerMoveRef.current = { x: event.clientX, time: performance.now() }
    didDragRef.current = false
    setIsDragging(true)
    setDragOffsetPx(0)
    event.currentTarget.setPointerCapture(event.pointerId)

    if (autoplayTimerRef.current !== null) {
      window.clearInterval(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId || dragStartXRef.current === null) return

    const now = performance.now()
    const deltaX = event.clientX - dragStartXRef.current
    const dt = now - lastPointerMoveRef.current.time

    if (Math.abs(deltaX) > 3) didDragRef.current = true

    if (dt > 0) {
      pointerVelocityRef.current = (event.clientX - lastPointerMoveRef.current.x) / dt
    }
    lastPointerMoveRef.current = { x: event.clientX, time: now }

    const width = rootRef.current?.clientWidth ?? 0
    let offset = deltaX

    if (width > 0) {
      const atStart = activeIndex === 0 && deltaX > 0
      const atEnd = activeIndex === slideCount - 1 && deltaX < 0
      if (atStart || atEnd) offset = deltaX * EDGE_DRAG_RESISTANCE
    }

    dragOffsetRef.current = offset
    setDragOffsetPx(offset)
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const width = rootRef.current?.clientWidth ?? 0
    const offset = dragOffsetRef.current
    const threshold = width * DRAG_THRESHOLD_RATIO
    const velocity = pointerVelocityRef.current

    setIsDragging(false)
    dragStartXRef.current = null
    activePointerIdRef.current = null
    dragOffsetRef.current = 0
    setDragOffsetPx(0)

    if (width <= 0) {
      resetAutoplayTimer()
      return
    }

    if (offset < -threshold || velocity < -FLICK_VELOCITY_THRESHOLD) {
      goToNext()
    } else if (offset > threshold || velocity > FLICK_VELOCITY_THRESHOLD) {
      goToPrevious()
    }

    resetAutoplayTimer()
  }

  const translateX = useMemo(() => {
    const base = -activeIndex * 100
    const width = rootRef.current?.clientWidth ?? 0
    const dragPercent = width > 0 ? (dragOffsetPx / width) * 100 : 0
    return `translateX(calc(${base}% + ${dragOffsetPx}px))`
  }, [activeIndex, dragOffsetPx])

  if (slideCount === 0) return null

  return (
    <div
      ref={rootRef}
      className={`absolute inset-0 overflow-hidden ${isDragging ? 'cursor-grabbing' : hasMultiple ? 'cursor-grab' : ''}`}
      style={{ touchAction: hasMultiple ? 'none' : undefined }}
      onPointerDown={hasMultiple ? handlePointerDown : undefined}
      onPointerMove={hasMultiple ? handlePointerMove : undefined}
      onPointerUp={hasMultiple ? handlePointerEnd : undefined}
      onPointerCancel={hasMultiple ? handlePointerEnd : undefined}
      role={hasMultiple ? 'region' : undefined}
      aria-roledescription={hasMultiple ? 'carousel' : undefined}
      aria-label={hasMultiple ? 'Hero image slider' : undefined}
    >
      <div
        className={`flex h-full w-full ${isDragging ? '' : 'transition-transform ease-in-out'}`}
        style={{
          transform: translateX,
          ...(isDragging ? {} : transitionStyle),
        }}
        onTransitionEnd={finishTransition}
      >
        {slides.map((slide, index) => {
          const resource = slide.image
          const shouldRender = loadedSlideIndices.has(index) || index === 0

          return (
            <div
              key={slide.id ?? `slide-${index}`}
              className="relative h-full w-full shrink-0"
              aria-hidden={index !== activeIndex}
            >
              {shouldRender && typeof resource === 'object' && resource !== null ? (
                <Media
                  resource={resource}
                  fill
                  priority={priority && index === 0}
                  imgClassName="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-surface-container-high" aria-hidden />
              )}
            </div>
          )
        })}
      </div>

      {hasMultiple && (
          <div
            className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:bottom-10"
            aria-live="polite"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id ?? `dot-${index}`}
                type="button"
                onClick={() => goTo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              />
            ))}
          </div>
      )}
    </div>
  )
}
