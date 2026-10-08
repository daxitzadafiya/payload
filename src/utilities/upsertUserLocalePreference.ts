import type { PayloadRequest } from 'payload'

export async function upsertUserLocalePreference(
  req: PayloadRequest,
  locale: string,
): Promise<void> {
  const { payload, user } = req

  if (!user) {
    return
  }

  const existing = await payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      and: [
        { key: { equals: 'locale' } },
        { 'user.relationTo': { equals: user.collection } },
        { 'user.value': { equals: user.id } },
      ],
    },
  })

  const preference = existing.docs[0]

  if (preference) {
    if (preference.value === locale) {
      return
    }

    await payload.update({
      id: preference.id,
      collection: 'payload-preferences',
      data: { value: locale },
      depth: 0,
      disableTransaction: true,
      req,
    })

    return
  }

  await payload.create({
    collection: 'payload-preferences',
    data: {
      key: 'locale',
      user: {
        relationTo: user.collection,
        value: user.id,
      },
      value: locale,
    },
    depth: 0,
    disableTransaction: true,
    req,
  })
}
