import {
  AlertCircle,
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleArrowRight,
  Globe,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Shield,
  Tag,
  User,
  type LucideIcon,
} from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/ui'

/** Maps legacy Material Symbols names (CMS/admin) to Lucide icons. */
const CMS_ICON_MAP: Record<string, LucideIcon> = {
  person: User,
  mail: Mail,
  call: Phone,
  chat: MessageSquare,
  message: MessageSquare,
  check: Check,
  check_circle: CheckCircle2,
  error: AlertCircle,
  lock: Lock,
  location_on: MapPin,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  arrow_circle_right: CircleArrowRight,
  sell: Tag,
  public: Globe,
  share: Share2,
  verified: BadgeCheck,
  workspace_premium: Award,
  shield: Shield,
}

type Props = {
  name?: string | null
  className?: string
  size?: number
  strokeWidth?: number
}

export function CmsIcon({ name, className, size = 18, strokeWidth = 2 }: Props) {
  if (!name?.trim()) return null

  const Icon = CMS_ICON_MAP[name.trim()] ?? CheckCircle2

  return <Icon className={cn('shrink-0', className)} size={size} strokeWidth={strokeWidth} />
}
