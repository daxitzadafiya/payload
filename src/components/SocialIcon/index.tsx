import * as FiIcons from 'react-icons/fi'
import type { IconType } from 'react-icons'
import { cn } from '@/utilities/ui'

type Props = {
  name?: string | null
  className?: string
  size?: number
}

export function SocialIcon({ name, className, size = 18 }: Props) {
  if (!name?.trim()) return null

  const Icon = FiIcons[name.trim() as keyof typeof FiIcons] as IconType | undefined
  if (!Icon) return null

  return <Icon className={cn('shrink-0', className)} size={size} />
}
