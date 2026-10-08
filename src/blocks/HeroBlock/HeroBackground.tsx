'use client'

import React from 'react'
import type { Page } from '@/payload-types'

import { Media } from '@/components/Media'

import { HeroImageSlider } from './HeroImageSlider'
import { HeroVideoBackground } from './HeroVideoBackground'

type HeroBlockProps = Extract<Page['layout'][0], { blockType: 'heroBlock' }>

export const HeroBackground: React.FC<HeroBlockProps> = (props) => {
  const {
    mediaType = 'image',
    imageMode = 'single',
    backgroundImage,
    sliderImages,
    sliderAutoplay,
    sliderInterval,
    videoSource,
    youtubeUrl,
    vimeoUrl,
    videoUpload,
  } = props

  if (mediaType === 'video') {
    return (
      <HeroVideoBackground
        videoSource={videoSource}
        youtubeUrl={youtubeUrl}
        vimeoUrl={vimeoUrl}
        videoUpload={videoUpload}
      />
    )
  }

  if (imageMode === 'slider' && sliderImages && sliderImages.length > 0) {
    return (
      <HeroImageSlider
        slides={sliderImages}
        autoplay={sliderAutoplay}
        intervalSeconds={sliderInterval}
      />
    )
  }

  if (typeof backgroundImage === 'object' && backgroundImage !== null) {
    return (
      <div className="absolute inset-0">
        <Media resource={backgroundImage} fill priority imgClassName="object-cover" />
      </div>
    )
  }

  return null
}
