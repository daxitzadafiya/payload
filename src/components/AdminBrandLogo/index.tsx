import Logo from '@/components/Logo/Logo'
import { getLogoSources } from '@/components/Logo/getLogoSources'
import type { Payload } from 'payload'

type AdminBrandLogoProps = {
  payload: Payload
}

export async function AdminBrandLogo({ payload }: AdminBrandLogoProps) {
  let sources = getLogoSources()

  try {
    const logo = await payload.findGlobal({
      slug: 'logo',
      depth: 1,
    })
    sources = getLogoSources(logo)
  } catch {
    // Keep static fallback sources when the global is unavailable.
  }

  return (
    <div className="login__brand">
      <Logo
        loading="eager"
        priority="high"
        sources={sources}
        onDarkBackground
        className="login__brand-logo"
      />
    </div>
  )
}
