'use client'

import clsx from 'clsx'
import React from 'react'

import { useFaviconSource } from '@/hooks/useFaviconSource'

interface Props {
  className?: string
}

export const Icon = (props: Props) => {
  const { className } = props
  const faviconSrc = useFaviconSource()

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt=""
      width={25}
      height={25}
      className={clsx('size-[25px]', className)}
      src={faviconSrc}
    />
  )
}

export default Icon
