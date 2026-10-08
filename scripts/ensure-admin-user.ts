import 'dotenv/config'

import { getPayload } from 'payload'

import { getAdminCredentials } from '../src/constants/adminUser.js'
import config from '../src/payload.config.js'
import { ensureAdminUser } from '../src/utilities/ensureAdminUser.js'

const payload = await getPayload({ config })

await ensureAdminUser(payload)

const { email } = getAdminCredentials()

payload.logger.info(`Admin user ready: ${email}`)

process.exit(0)
