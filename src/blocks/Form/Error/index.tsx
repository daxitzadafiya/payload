'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'

export const Error = ({ name }: { name: string }) => {
  const {
    formState: { errors },
  } = useFormContext()
  const message = errors[name]?.message as string | undefined

  if (!message) return null

  return <div className="mt-2 text-sm text-[var(--color-error)]">{message}</div>
}
