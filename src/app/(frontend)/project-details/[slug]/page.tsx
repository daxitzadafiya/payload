import type { Metadata } from 'next'

import { ProjectDetailPageClient } from '@/components/ProjectDetail/ProjectDetailPageClient'
import { getContactForm } from '@/utilities/getContactForm'
import { formatPageTitle, getAppName } from '@/utilities/getAppName'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function generateMetadata(): Promise<Metadata> {
  const logo = await getCachedGlobal('logo', 0)()

  return {
    title: formatPageTitle('Project Details', getAppName(logo)),
  }
}

export default async function ProjectDetailsPage() {
  const contactForm = await getContactForm()

  return <ProjectDetailPageClient contactForm={contactForm} />
}
