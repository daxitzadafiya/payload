'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { Media as PayloadMedia } from '@/payload-types'

import { VideoMedia } from '@/components/Media/VideoMedia'
import { resolveHeroVideoEmbedUrl, type HeroVideoSource } from '@/utilities/heroVideo'

type Props = {
  videoSource?: HeroVideoSource | null
  youtubeUrl?: string | null
  vimeoUrl?: string | null
  videoUpload?: number | PayloadMedia | null
}

const VIDEO_ASPECT = 16 / 9

const iframeAllow =
  'autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'

const getCoverDimensions = (containerWidth: number, containerHeight: number) => {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 0, height: 0 }
  }

  const width = Math.max(containerWidth, containerHeight * VIDEO_ASPECT)
  const height = Math.max(containerHeight, containerWidth / VIDEO_ASPECT)

  return { width, height }
}

export const HeroVideoBackground: React.FC<Props> = ({
  videoSource,
  youtubeUrl,
  vimeoUrl,
  videoUpload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [coverSize, setCoverSize] = useState({ width: 0, height: 0 })

  const embedUrl = resolveHeroVideoEmbedUrl(videoSource, youtubeUrl, vimeoUrl)
  const isEmbed = Boolean(embedUrl)
  const isYouTube = videoSource === 'youtube'
  const isUpload =
    videoSource === 'upload' && typeof videoUpload === 'object' && videoUpload !== null

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsInView(true)
      },
      { threshold: 0.1 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateCoverSize = () => {
      setCoverSize(getCoverDimensions(element.clientWidth, element.clientHeight))
    }

    updateCoverSize()

    const observer = new ResizeObserver(updateCoverSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (!isEmbed && !isUpload) return null

  const youtubeScale = isYouTube ? 1.08 : 1

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black" aria-hidden>
      {isEmbed && isInView && coverSize.width > 0 && coverSize.height > 0 && (
        <iframe
          title="Hero background video"
          src={embedUrl}
          className="pointer-events-none absolute top-1/2 left-1/2 border-0"
          style={{
            width: coverSize.width,
            height: coverSize.height,
            transform: `translate(-50%, -50%) scale(${youtubeScale})`,
          }}
          allow={iframeAllow}
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
        />
      )}

      {isUpload && (
        <VideoMedia
          resource={videoUpload}
          videoClassName="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
