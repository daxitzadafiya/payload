import Script from 'next/script'

import type { PublicVirtualAssistantSettings } from '@/settings/integrations/shared'

type Props = {
  settings: PublicVirtualAssistantSettings
}

/**
 * Loads the Optima webchat widget via next/script.
 * Admin pastes the full <script …> tag; we parse src + data-agency-key and load those — we do not inject raw HTML.
 */
export function VirtualAssistantScript({ settings }: Props) {
  if (!settings.enabled || !settings.scriptSrc || !settings.agencyKey) return null

  return (
    <Script
      id="virtual-assistant-widget"
      src={settings.scriptSrc}
      strategy="lazyOnload"
      data-agency-key={settings.agencyKey}
    />
  )
}
