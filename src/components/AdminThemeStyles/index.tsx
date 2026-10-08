import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { buildAdminThemeStylePayload } from '@/utilities/adminThemeBridge'
import { isGlobalTrashed } from '@/utilities/isGlobalTrashed'

/**
 * Injects Theme → Custom CSS + fonts into the Payload admin (incl. auth pages).
 * Visual only — does not change Theme global behaviour on the public site.
 */
export async function AdminThemeStyles() {
  let customCSS: string | null = null
  let fontMode: string | null = null
  let googleFonts: Array<{ family?: string | null; active?: boolean | null }> | null = null

  try {
    const payload = await getPayload({ config: configPromise })
    const theme = await payload.findGlobal({
      slug: 'theme',
      depth: 0,
    })
    if (!isGlobalTrashed(theme)) {
      customCSS = theme.customCSS ?? null
      fontMode = theme.fontMode ?? null
      googleFonts = theme.googleFonts ?? null
    }
  } catch (error) {
    console.error('[AdminThemeStyles] Failed to load Theme global:', error)
  }

  const { css, stylesheetUrl } = buildAdminThemeStylePayload({
    customCSS,
    fontMode,
    googleFonts,
  })

  return (
    <>
      {stylesheetUrl ? (
        <link href={stylesheetUrl} rel="stylesheet" precedence="high" />
      ) : null}
      <style
        href="admin-site-theme"
        precedence="high"
        dangerouslySetInnerHTML={{ __html: css }}
      />
    </>
  )
}

export default AdminThemeStyles
