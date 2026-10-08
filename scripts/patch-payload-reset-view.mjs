import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const targetFile = path.resolve(
  __dirname,
  '../node_modules/@payloadcms/next/dist/views/Root/getRouteData.js',
)

const originalBlock = `        if (\`/\${segmentOne}\` === config.admin.routes.reset) {
          // --> /reset/:token
          ViewToRender = {
            Component: ResetPassword
          };
          templateClassName = baseClasses[segmentTwo];
          templateType = 'minimal';
          viewType = 'reset';`

const patchedBlock = `        if (\`/\${segmentOne}\` === config.admin.routes.reset) {
          // --> /reset/:token
          const customResetView = getCustomViewByKey({
            config,
            viewKey: 'reset'
          });
          ViewToRender = customResetView?.view || {
            Component: ResetPassword
          };
          templateClassName = baseClasses.reset;
          templateType = 'minimal';
          viewType = 'reset';`

if (!fs.existsSync(targetFile)) {
  console.warn('[patch-payload-reset-view] Skipped: @payloadcms/next is not installed.')
  process.exit(0)
}

const source = fs.readFileSync(targetFile, 'utf8')

if (source.includes('customResetView')) {
  process.exit(0)
}

if (!source.includes(originalBlock)) {
  console.warn(
    '[patch-payload-reset-view] Skipped: getRouteData.js no longer matches the expected source.',
  )
  process.exit(0)
}

fs.writeFileSync(targetFile, source.replace(originalBlock, patchedBlock))
console.log('[patch-payload-reset-view] Applied custom reset-password view routing patch.')
