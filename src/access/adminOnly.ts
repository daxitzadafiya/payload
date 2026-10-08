import type { Access } from 'payload'

import type { User } from '@/payload-types'

export const adminOnly: Access = ({ req: { user } }) => {
  const u = user as User | null | undefined
  return Boolean(u?.roles?.includes('admin'))
}
