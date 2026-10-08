import type { Payload } from 'payload'

import { getAdminCredentials } from '@/constants/adminUser'
import type { User } from '@/payload-types'

/**
 * Ensures the website admin user exists with the admin role.
 * Only creates the admin if it does not already exist.
 * It will NOT overwrite the password or other fields on every startup.
 */
export async function ensureAdminUser(payload: Payload): Promise<void> {
  const { email, password } = getAdminCredentials()

  payload.logger.info('Checking admin user...')

  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    where: {
      email: {
        equals: email,
      },
    },
  })

  payload.logger.info('Existing admin user...')
  if (existing.docs.length > 0) {
    payload.logger.info('Admin already exists. Skipping creation.')
    return
  }

  const adminData: Pick<User, 'email' | 'name' | 'password' | 'roles'> = {
    email,
    name: 'Admin',
    password,
    roles: ['admin'],
  }

  payload.logger.info('Creating admin...')

  await payload.create({
    collection: 'users',
    data: adminData,
  })

  payload.logger.info('Admin user created successfully.')
}
