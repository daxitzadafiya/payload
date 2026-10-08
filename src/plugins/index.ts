import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { APIError, Plugin } from 'payload'
import { activityLogPlugin } from '@/plugins/activityLogPlugin'
import { forceTranslatePlugin } from '@/plugins/forceTranslatePlugin'
import { trashAndVersionsPlugin } from '@/plugins/trashAndVersionsPlugin'
import { a } from '@/utilities/adminI18n'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { DEFAULT_APP_NAME, formatPageTitle, getAppNameFromDatabase } from '@/utilities/getAppName'
import { getServerSideURL } from '@/utilities/getURL'
import { isContactFormTitle } from '@/utilities/isContactFormSubmission'
import { sendFormSubmissionNotificationEmail } from '@/email/sendNotificationEmail'
import { submitContactToOptimaCrm } from '@/utilities/submitContactToOptimaCrm'
import { submitOwnerToOptimaCrm } from '@/utilities/submitOwnerToOptimaCrm'
import { verifyRecaptchaToken } from '@/utilities/verifyRecaptcha'

let resolvedAppName: string | null = null
void getAppNameFromDatabase().then((name) => {
  resolvedAppName = name
})

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return formatPageTitle(doc?.title, resolvedAppName ?? DEFAULT_APP_NAME)
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      labels: {
        singular: a('admin.redirects.singular', 'Redirect'),
        plural: a('admin.redirects.plural', 'Redirects'),
      },
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: a(
                  'admin.redirects.fromDescription',
                  'You will need to rebuild the website when changing this field.',
                ),
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  forceTranslatePlugin(),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      labels: {
        singular: a('admin.forms.singular', 'Form'),
        plural: a('admin.forms.plural', 'Forms'),
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
    formSubmissionOverrides: {
      labels: {
        singular: a('admin.formSubmissions.singular', 'Form Submission'),
        plural: a('admin.formSubmissions.plural', 'Form Submissions'),
      },
      fields: ({ defaultFields }) => {
        return [
          ...defaultFields,
          // Hidden fields used to verify public reCAPTCHA before accepting submissions.
          {
            name: 'recaptchaRequired',
            type: 'checkbox',
            defaultValue: false,
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
            },
          },
          {
            name: 'recaptchaToken',
            type: 'text',
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
            },
          },
          {
            name: 'syncToOptimaCrm',
            type: 'checkbox',
            defaultValue: false,
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
            },
          },
          {
            name: 'syncToOptimaOwners',
            type: 'checkbox',
            defaultValue: false,
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
            },
          },
          {
            name: 'submissionLocale',
            type: 'text',
            required: false,
            admin: {
              hidden: true,
              readOnly: true,
              description:
                'Site locale when the visitor submitted the form (for localized emails).',
            },
          },
        ]
      },
      hooks: {
        beforeChange: [
          async ({ data, req, operation }) => {
            if (operation !== 'create') return data

            const form = data?.form
            let formTitle: string | undefined

            if (typeof form === 'number') {
              try {
                const formDoc = await req.payload.findByID({
                  collection: 'forms',
                  id: form,
                  depth: 0,
                  overrideAccess: true,
                })
                formTitle = formDoc?.title
              } catch {
                // fall through
              }
            } else if (typeof form === 'object' && form !== null && 'title' in form) {
              formTitle = (form as { title?: string }).title
            }

            const syncToOwners = data?.syncToOptimaOwners === true
            const syncToAccounts =
              !syncToOwners &&
              (data?.syncToOptimaCrm === true || isContactFormTitle(formTitle))

            if (!syncToOwners && !syncToAccounts) return data

            if (data?.recaptchaRequired === true) {
              const token = data?.recaptchaToken
              if (typeof token !== 'string' || !token) {
                throw new Error('Please complete reCAPTCHA before submitting.')
              }

              const forwardedFor = req.headers.get('x-forwarded-for')
              const remoteip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined

              const ok = await verifyRecaptchaToken({
                token,
                remoteip,
              })

              if (!ok) throw new Error('reCAPTCHA verification failed. Please try again.')
            }

            const submissionLocale =
              typeof data?.submissionLocale === 'string' ? data.submissionLocale : undefined

            try {
              if (syncToOwners) {
                await submitOwnerToOptimaCrm(data?.submissionData, submissionLocale)
              } else {
                await submitContactToOptimaCrm(data?.submissionData, submissionLocale)
              }
            } catch (error) {
              const message =
                error instanceof Error && error.message.trim()
                  ? error.message
                  : 'CRM submission failed. Please try again later.'
              throw new APIError(message, 400)
            }
            return data
          },
        ],
        afterChange: [
          async ({ doc, operation, req }) => {
            if (operation !== 'create') return

            try {
              await sendFormSubmissionNotificationEmail({
                payload: req.payload,
                doc,
              })
            } catch (error) {
              req.payload.logger.error({
                err: error,
                msg: 'Failed to send form submission notification email',
              })
            }
          },
        ],
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      labels: {
        singular: a('admin.search.singular', 'Search Result'),
        plural: a('admin.search.plural', 'Search Results'),
      },
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  mcpPlugin({
    collections: {
      pages: { enabled: true },
      posts: { enabled: true },
      categories: { enabled: { find: true } },
      media: { enabled: { find: true } },
    },
    globals: {
      header: { enabled: { find: true, update: true } },
      footer: { enabled: { find: true, update: true } },
    },
  }),
  // Trash/versions for all collections + globals soft-trash (before audit so hooks wrap results).
  trashAndVersionsPlugin(),
  // Must be last so plugin-injected collections (redirects, forms, MCP, search) get audit hooks.
  activityLogPlugin(),
]
