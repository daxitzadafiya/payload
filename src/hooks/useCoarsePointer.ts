'use client'

import { useEffect, useState } from 'react'

export function useCoarsePointer(): boolean {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setIsCoarsePointer(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isCoarsePointer
}
