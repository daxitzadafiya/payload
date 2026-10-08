'use client'

import React from 'react'

import type { CRMPropertyVideoItem } from '@/utilities/crmPropertyVideo'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  videos: CRMPropertyVideoItem[]
  propertyTitle: string
}

const iframeAllowByKind = (kind: CRMPropertyVideoItem['kind']): string => {
  if (kind === 'matterport') {
    return 'fullscreen; vr'
  }

  return 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
}

const aspectClassByKind = (kind: CRMPropertyVideoItem['kind']): string => {
  if (kind === 'matterport') {
    return 'aspect-[4/3] md:aspect-video'
  }

  return 'aspect-video'
}

const isDirectVideoFile = (url: string): boolean =>
  /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)

export const PropertyDetailVideo: React.FC<Props> = ({ videos, propertyTitle }) => {
  const tourLabel = useTranslation('propertyDetail.video.tour', 'Tour')
  const videoHeading = useTranslation('propertyDetail.video.heading', 'Video')

  if (videos.length === 0) return null

  return (
    <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-16 md:mb-24">
      <div className="flex w-full flex-col gap-10 md:gap-12">
        {videos.map((video, index) => {
          const title =
            videos.length > 1
              ? video.label === 'Tour'
                ? `360° ${tourLabel}`
                : video.label
              : videoHeading
          const useNativeVideo =
            video.kind === 'file' ||
            (video.kind === 'iframe' && isDirectVideoFile(video.sourceUrl || video.embedUrl))

          return (
            <div key={`${video.kind}-${video.embedUrl}-${index}`} className="w-full">
              <div className="mb-6 md:mb-8">
                <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
                <h2 className="m-0 font-headline-lg text-[clamp(1.5rem,2.2vw,2rem)] font-light tracking-[0.01em] text-primary">
                  {title}
                </h2>
              </div>

              {/*
                Keep a true 16:9 (or matterport) box at content width.
                Do not combine full-width + max-height — that flattens the box and causes side black bars.
              */}
              <div className="relative mx-auto w-full max-w-4xl">
                <div
                  className="pointer-events-none absolute -right-2 -top-2 h-[94%] w-[94%] rounded-[1.5rem] border border-secondary/30 md:rounded-[1.75rem]"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_28px_60px_-32px_rgba(0,0,0,0.35)] md:rounded-[1.75rem]">
                  <div
                    className={`relative w-full overflow-hidden bg-surface-sand ${aspectClassByKind(video.kind)}`}
                  >
                  {useNativeVideo ? (
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                      title={`${video.label} — ${propertyTitle}`}
                      src={video.sourceUrl || video.embedUrl}
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <iframe
                      title={`${video.label} — ${propertyTitle}`}
                      src={video.embedUrl}
                      className="absolute inset-0 h-full w-full border-0"
                      allow={iframeAllowByKind(video.kind)}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  )}
                </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
