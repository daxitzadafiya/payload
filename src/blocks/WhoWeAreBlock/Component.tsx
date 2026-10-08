'use client'

import React from 'react'
import type { WhoWeAreBlock as WhoWeAreBlockType } from '@/payload-types'
import { AboutStorySection } from '@/components/AboutStorySection'

type Props = WhoWeAreBlockType & {
  disableInnerContainer?: boolean
}

export const WhoWeAreBlock: React.FC<Props> = ({
  subtitle,
  title,
  description,
  image,
  collageImage2,
  collageImage3,
  buttonText,
  ctaLink,
}) => {
  return (
    <AboutStorySection
      subtitle={subtitle}
      title={title}
      body={description}
      buttonText={buttonText}
      ctaLink={ctaLink}
      primaryImage={image}
      collageImage2={collageImage2}
      collageImage3={collageImage3}
    />
  )
}
