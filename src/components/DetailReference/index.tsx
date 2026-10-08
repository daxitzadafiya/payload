import React from 'react'

type Props = {
  prefix: string
  reference: string
  className?: string
}

export const DetailReference: React.FC<Props> = ({ prefix, reference, className = '' }) => {
  const value = reference.trim()
  if (!value) return null

  return (
    <p
      className={`mb-0 font-label-nav text-[10px] uppercase tracking-[0.2em] text-secondary ${className}`.trim()}
    >
      <span className="truncate">
        {prefix} {value}
      </span>
    </p>
  )
}
