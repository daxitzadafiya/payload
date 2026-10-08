export async function revalidateCacheTag(tag: string): Promise<void> {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(tag, 'max')
}

export async function revalidateCachePath(path: string): Promise<void> {
  const { revalidatePath } = await import('next/cache')
  revalidatePath(path)
}
