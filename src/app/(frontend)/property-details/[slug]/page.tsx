import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PropertyDetailPageClient } from '@/components/PropertyDetail/PropertyDetailPageClient'
import { getContactForm } from '@/utilities/getContactForm'
import { formatPageTitle, getAppName } from '@/utilities/getAppName'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function generateMetadata(): Promise<Metadata> {
  const logo = await getCachedGlobal('logo', 0)()

  return {
    title: formatPageTitle('Property Details', getAppName(logo)),
  }
}

export default async function PropertyDetailsPage() {
  const contactForm = await getContactForm()

  return (
    <Suspense
      fallback={
        <main className="pt-28 bg-surface-bright">
          <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
              <div className="lg:col-span-7 xl:col-span-8 aspect-[4/3] rounded-lg bg-surface-container-low animate-pulse" />
              <div className="lg:col-span-5 xl:col-span-4 space-y-6 py-2">
                <div className="h-4 w-48 rounded bg-surface-container-low animate-pulse" />
                <div className="h-16 w-full rounded bg-surface-container-low animate-pulse" />
                <div className="h-8 w-40 rounded bg-surface-container-low animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      }
    >
      <PropertyDetailPageClient contactForm={contactForm} />
    </Suspense>
  )
}
