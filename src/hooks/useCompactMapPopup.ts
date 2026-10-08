'use client'

import { useEffect, useState } from 'react'

/** Viewports below lg (1024px) use the bottom-sheet popup — covers phones, iPads, and small tablets. */
export function useCompactMapPopup(): boolean {
  const [isCompact, setIsCompact] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 63.999rem)')

    const update = () => setIsCompact(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isCompact
}
