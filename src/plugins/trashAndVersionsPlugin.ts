import type { Access, AccessArgs, Config, Endpoint, Plugin } from 'payload'

import {
  DEFAULT_MAX_PER_DOC,
  GLOBALS_TRASH_PATH,
  TRASH_VERSIONS_COLLECTION_OPT_OUT,
} from './trashAndVersions/constants'
import { globalsTrashEndpoint } from './trashAndVersions/endpoint'
import { injectSoftDeleteFields } from './trashAndVersions/injectSoftDeleteFields'
import {
  createGlobalSoftDeleteAfterChange,
  createGlobalSoftDeleteAfterRead,
  createGlobalSoftDeleteBeforeChange,
} from './trashAndVersions/softDeleteArrayItems'
import { getSoftDeleteSpecsForGlobal } from './trashAndVersions/softDeleteConfig'

function shouldOptOutCollection(slug: string): boolean {
  return (
    TRASH_VERSIONS_COLLECTION_OPT_OUT.has(slug) ||
    slug.startsWith('payload-') ||
    slug === 'global-version-snapshots'
  )
}

/**
 * Allow soft-delete (move to trash) only. Permanent delete is always denied.
 *
 * Payload calls delete access with `data.deletedAt` set when trashing; permanent
 * delete / Empty Trash / UI probes pass no deletedAt (or no data).
 * When trash is allowed but permanent delete is not:
 * - "Skip trash and delete permanently" checkbox is hidden
 * - Trash view Delete / Empty trash / Permanently Delete are hidden
 */
function allowTrashOnlyDelete(existingDelete: Access | undefined): Access {
  return async (args: AccessArgs) => {
    const deletedAt = (args.data as { deletedAt?: unknown } | undefined)?.deletedAt
    if (!deletedAt) {
      return false
    }

    if (typeof existingDelete === 'function') {
      return existingDelete(args)
    }

    if (existingDelete === false) {
      return false
    }

    // No prior delete access: require an authenticated user (matches most collections).
    return Boolean(args.req.user)
  }
}

/**
 * Native collection trash + native global versions, plus soft-deleted array
 * rows on globals (Globals Trash list + restore). Register before activityLogPlugin.
 */
export const trashAndVersionsPlugin =
  (): Plugin =>
  (config: Config): Config => {
    const collections = (config.collections || []).map((collection) => {
      if (shouldOptOutCollection(collection.slug)) return collection

      return {
        ...collection,
        trash: true,
        access: {
          ...collection.access,
          delete: allowTrashOnlyDelete(collection.access?.delete),
        },
        ...(collection.versions ? { versions: collection.versions } : {}),
      }
    })

    const globals = (config.globals || []).map((global) => {
      const softDeleteSpecs = getSoftDeleteSpecsForGlobal(global.slug)
      const fields =
        softDeleteSpecs.length > 0
          ? injectSoftDeleteFields(global.fields, softDeleteSpecs)
          : global.fields

      const beforeChangeHooks = softDeleteSpecs.length
        ? [createGlobalSoftDeleteBeforeChange(softDeleteSpecs)]
        : []
      const afterReadHooks = softDeleteSpecs.length
        ? [createGlobalSoftDeleteAfterRead(softDeleteSpecs)]
        : []
      const afterChangeHooks = softDeleteSpecs.length
        ? [createGlobalSoftDeleteAfterChange(softDeleteSpecs)]
        : []

      return {
        ...global,
        fields,
        versions: global.versions ?? { max: DEFAULT_MAX_PER_DOC },
        hooks: {
          ...global.hooks,
          beforeChange: [...(global.hooks?.beforeChange || []), ...beforeChangeHooks],
          afterRead: [...(global.hooks?.afterRead || []), ...afterReadHooks],
          afterChange: [...(global.hooks?.afterChange || []), ...afterChangeHooks],
        },
      }
    })

    const existingEndpoints = (config.endpoints || []) as Endpoint[]
    const endpoints: Endpoint[] = [
      ...existingEndpoints.filter(
        (endpoint) =>
          endpoint.path !== '/trash/globals' &&
          endpoint.path !== '/trash/global-versions' &&
          endpoint.path !== '/globals-trash' &&
          endpoint.path !== '/globals-versions',
      ),
      globalsTrashEndpoint,
    ]

    const afterNavLinks = [
      ...(config.admin?.components?.afterNavLinks || []),
      '@/components/GlobalsTrash/GlobalsTrashNavLink#GlobalsTrashNavLink',
    ]

    const views = {
      ...config.admin?.components?.views,
      globalsTrash: {
        Component: '@/components/GlobalsTrash/GlobalsTrashView',
        path: GLOBALS_TRASH_PATH,
        meta: {
          title: 'Globals Trash',
        },
      },
    }

    return {
      ...config,
      collections,
      globals,
      endpoints,
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          afterNavLinks,
          views,
        },
      },
    }
  }
