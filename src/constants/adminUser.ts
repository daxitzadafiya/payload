export function getAdminCredentials(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Missing ADMIN_EMAIL or ADMIN_PASSWORD. Add them to your .env file.',
    )
  }

  return { email, password }
}

export function hasAdminCredentials(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)
}
