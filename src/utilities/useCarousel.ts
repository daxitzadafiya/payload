'use client'

import { useCallback, useEffect, useState } from 'react'

export const DESKTOP_BREAKPOINT_MEDIA = '(min-width: 48rem)'
export const CAROUSEL_GAP_PX = 24

export function useCardsPerView(desktop: number, mobile: number) {
  const [cardsPerView, setCardsPerView] = useState(mobile)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_BREAKPOINT_MEDIA)
    const update = () => setCardsPerView(mq.matches ? desktop : mobile)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [desktop, mobile])

  return cardsPerView
}

export function useCarouselIndex(total: number, cardsPerView: number) {
  const maxIndex = Math.max(0, total - cardsPerView)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrentIndex(Math.max(0, Math.min(maxIndex, index)))
      setTimeout(() => setIsTransitioning(false), 600)
    },
    [isTransitioning, maxIndex],
  )

  const handlePrev = useCallback(() => {
    setCurrentIndex((current) => (current <= 0 ? maxIndex : current - 1))
  }, [maxIndex])

  const handleNext = useCallback(() => {
    setCurrentIndex((current) => (current >= maxIndex ? 0 : current + 1))
  }, [maxIndex])

  const cardWidth = `calc((100cqw - ${CAROUSEL_GAP_PX * (cardsPerView - 1)}px) / ${cardsPerView})`
  const translateX = `calc(-${currentIndex} * (100cqw + ${CAROUSEL_GAP_PX}px) / ${cardsPerView})`

  return {
    currentIndex,
    maxIndex,
    goTo,
    handlePrev,
    handleNext,
    cardWidth,
    translateX,
    isTransitioning,
  }
}
