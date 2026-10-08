import type { Config, Plugin } from 'payload'

import { ActivityLogs } from '@/collections/ActivityLogs'
import {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
  createGlobalAuditAfterChange,
  EXCLUDED_SLUGS,
} from '@/utilities/auditLog'

/**
 * Registers the Activity Logs collection and injects audit hooks into every
 * collection and global (except system / self). Register this plugin last so
 * plugin-owned collections (redirects, forms, MCP keys, etc.) are wrapped too.
 */
export const activityLogPlugin =
  (): Plugin =>
  (config: Config): Config => {
    const collections = (config.collections || []).map((collection) => {
      if (EXCLUDED_SLUGS.has(collection.slug)) return collection

      return {
        ...collection,
        hooks: {
          ...collection.hooks,
          afterChange: [
            ...(collection.hooks?.afterChange || []),
            createCollectionAuditAfterChange(collection),
          ],
          afterDelete: [
            ...(collection.hooks?.afterDelete || []),
            createCollectionAuditAfterDelete(collection),
          ],
        },
      }
    })

    const globals = (config.globals || []).map((global) => ({
      ...global,
      hooks: {
        ...global.hooks,
        afterChange: [...(global.hooks?.afterChange || []), createGlobalAuditAfterChange(global)],
      },
    }))

    return {
      ...config,
      collections: [...collections, ActivityLogs],
      globals,
    }
  }
