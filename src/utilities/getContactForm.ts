import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { Form } from '@/payload-types'

async function fetchContactForm(): Promise<Form | null> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'forms',
    where: {
      title: {
        equals: 'Contact',
      },
    },
    limit: 1,
    depth: 0,
  })

  return result.docs[0] ?? null
}

export const getCachedContactForm = unstable_cache(fetchContactForm, ['contact-form'], {
  tags: ['contact-form'],
})

export async function getContactForm(): Promise<Form | null> {
  return getCachedContactForm()
}
