import 'dotenv/config'

/**
 * Run Payload schema push once (single process) before starting Next dev.
 * Avoids race when the frontend and admin both call getPayload during push.
 *
 * Usage:
 *   node scripts/push-schema-once.mjs
 *
 * Answer interactive prompts in this terminal (create column, yes for data loss).
 */
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

console.log('Initializing Payload (schema push may prompt)...\n')

const payload = await getPayload({ config })

console.log('\nSchema push finished. You can now run: npm run dev')
console.log('(Do not open the site until dev has started cleanly.)')

await payload.db.destroy?.()
