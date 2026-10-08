import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const targetFile = path.resolve(
  __dirname,
  '../node_modules/@payloadcms/next/dist/layouts/Root/index.js',
)

const originalBlock = `  return /*#__PURE__*/_jsxs("html", {
    "data-theme": theme,
    dir: dir,
    lang: languageCode,
    suppressHydrationWarning: config?.admin?.suppressHydrationWarning ?? false,
    ...htmlProps,
    children: [/*#__PURE__*/_jsx("head", {
      children: /*#__PURE__*/_jsx("style", {
        children: \`@layer payload-default, payload;\`
      })
    }), /*#__PURE__*/_jsxs("body", {
      children: [`

const patchedBlock = `  const suppressHydrationWarning = config?.admin?.suppressHydrationWarning ?? false;
  return /*#__PURE__*/_jsxs("html", {
    "data-theme": theme,
    dir: dir,
    lang: languageCode,
    suppressHydrationWarning,
    ...htmlProps,
    children: [/*#__PURE__*/_jsx("head", {
      suppressHydrationWarning,
      children: /*#__PURE__*/_jsx("style", {
        suppressHydrationWarning,
        children: \`@layer payload-default, payload;\`
      })
    }), /*#__PURE__*/_jsxs("body", {
      suppressHydrationWarning,
      children: [`

if (!fs.existsSync(targetFile)) {
  console.warn('[patch-payload-root-hydration] Skipped: @payloadcms/next is not installed.')
  process.exit(0)
}

const source = fs.readFileSync(targetFile, 'utf8')

if (source.includes('suppressHydrationWarning,\n      children: /*#__PURE__*/_jsx("style"')) {
  process.exit(0)
}

if (!source.includes(originalBlock)) {
  console.warn(
    '[patch-payload-root-hydration] Skipped: Root/index.js no longer matches the expected source.',
  )
  process.exit(0)
}

fs.writeFileSync(targetFile, source.replace(originalBlock, patchedBlock))
console.log(
  '[patch-payload-root-hydration] Applied suppressHydrationWarning on admin head/style/body.',
)
