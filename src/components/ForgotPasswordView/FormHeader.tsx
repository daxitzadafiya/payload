import React from 'react'

type FormHeaderProps = {
  description?: React.ReactNode
  heading?: string
}

export function FormHeader({ description, heading }: FormHeaderProps) {
  if (!heading) {
    return null
  }

  return (
    <div className="form-header">
      <h1>{heading}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
