'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { AboutStorySection } from '@/components/AboutStorySection'

type Props = Extract<Page['layout'][0], { blockType: 'missionBlock' }>

export const MissionBlock: React.FC<Props> = ({
  subtitle,
  title,
  content,
  buttonText,
  ctaLink,
  image,
  collageImage2,
  collageImage3,
}) => {
  return (
    <AboutStorySection
      subtitle={subtitle}
      title={title}
      body={content}
      buttonText={buttonText}
      ctaLink={ctaLink}
      primaryImage={image}
      collageImage2={collageImage2}
      collageImage3={collageImage3}
    />
  )
}
