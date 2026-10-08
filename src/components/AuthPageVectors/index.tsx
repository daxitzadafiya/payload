'use client'

import React from 'react'

/**
 * Atmospheric ornaments + quiet brand line for auth pages.
 */
export default function AuthPageVectors() {
  return (
    <div className="auth-ornament" aria-hidden>
      <span className="auth-ornament__glow" />
      <span className="auth-ornament__ring auth-ornament__ring--lg" />
      <span className="auth-ornament__ring auth-ornament__ring--md" />
      <span className="auth-ornament__ring auth-ornament__ring--sm" />
      <span className="auth-ornament__corner auth-ornament__corner--tl" />
      <span className="auth-ornament__corner auth-ornament__corner--tr" />
      <span className="auth-ornament__corner auth-ornament__corner--bl" />
      <span className="auth-ornament__corner auth-ornament__corner--br" />
    </div>
  )
}
