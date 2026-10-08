'use client'

import React from 'react'
import type { Media as MediaType } from '@/payload-types'
import { Media } from '@/components/Media'

type MediaValue = string | number | MediaType | null | undefined

const isMedia = (value: MediaValue): value is MediaType =>
  typeof value === 'object' && value !== null

type Props = {
  primary?: MediaValue
  secondary?: MediaValue
  tertiary?: MediaValue
}

const frameClassName =
  'overflow-hidden rounded-3xl bg-surface-sand shadow-[0_22px_48px_-18px_rgba(0,0,0,0.38)] ring-1 ring-black/[0.05]'

const CollageDecor: React.FC = () => {
  const gridId = React.useId().replace(/:/g, '')

  return (
    <div className="pointer-events-none absolute -inset-[12%] z-0 text-secondary" aria-hidden>
      <svg
        className="absolute right-[6%] top-[8%] h-[68%] w-[48%] opacity-[0.1]"
        viewBox="0 0 240 320"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id={gridId} width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke="currentColor" strokeWidth="0.55" />
          </pattern>
        </defs>
        <rect width="240" height="320" fill={`url(#${gridId})`} />
      </svg>

      <svg
        className="collage-lines-float absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 800 760"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse
          cx="400"
          cy="375"
          rx="300"
          ry="205"
          transform="rotate(-14 400 375)"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.38"
        />
        <ellipse
          cx="415"
          cy="365"
          rx="265"
          ry="220"
          transform="rotate(20 415 365)"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.28"
        />
        <ellipse
          cx="375"
          cy="395"
          rx="225"
          ry="175"
          transform="rotate(-6 375 395)"
          stroke="currentColor"
          strokeWidth="0.55"
          opacity="0.22"
        />
        <path
          d="M145 195C235 78 445 48 565 128c95 64 138 205 72 310"
          stroke="currentColor"
          strokeWidth="0.65"
          opacity="0.32"
        />
        <path
          d="M115 505C195 635 415 700 575 615c105-55 145-185 82-278"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.26"
        />
      </svg>
    </div>
  )
}

export const ImageCollage: React.FC<Props> = ({ primary, secondary, tertiary }) => {
  const hasPrimary = isMedia(primary)
  const hasSecondary = isMedia(secondary)
  const hasTertiary = isMedia(tertiary)

  if (!hasPrimary && !hasSecondary && !hasTertiary) return null

  if (!hasSecondary && !hasTertiary) {
    return (
      <div className={frameClassName}>
        <div className="relative aspect-[4/3]">
          {hasPrimary ? <Media resource={primary} fill imgClassName="object-cover" /> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-xl overflow-visible lg:max-w-none">
      <div className="relative aspect-[5/4] w-full overflow-visible">
        <CollageDecor />

        {hasPrimary ? (
          <div className={`absolute left-[8%] top-[16%] z-10 w-[62%] ${frameClassName}`}>
            <div className="relative aspect-[4/3]">
              <Media resource={primary} fill imgClassName="object-cover" />
            </div>
          </div>
        ) : null}

        {hasTertiary ? (
          <div className={`absolute right-[1%] top-[2%] z-20 w-[33%] ${frameClassName}`}>
            <div className="relative aspect-[3/4]">
              <Media resource={tertiary} fill imgClassName="object-cover" />
            </div>
          </div>
        ) : null}

        {hasSecondary ? (
          <div className={`absolute bottom-[2%] left-0 z-30 w-[36%] ${frameClassName}`}>
            <div className="relative aspect-[5/4]">
              <Media resource={secondary} fill imgClassName="object-cover object-[center_40%]" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
