export const DEFAULT_RIGHTS_RESERVED = 'ALL RIGHTS RESERVED.'

export const DEFAULT_POWERED_BY_TEXT = 'Powered by'
export const DEFAULT_POWERED_BY_LINK_LABEL = 'Optima-CRM'
export const DEFAULT_POWERED_BY_URL = 'https://optima-crm.com'

/**
 * Builds the footer copyright line. Year and app name are fixed; only the
 * rights-reserved phrase comes from the localized Footer global field.
 */
export function formatFooterCopyright(rightsReserved: string, appName: string): string {
  const rights = rightsReserved.trim() || DEFAULT_RIGHTS_RESERVED

  return `© ${new Date().getFullYear()} ${appName}. ${rights}`
}
