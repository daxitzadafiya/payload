'use client'

import { notFound, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { ProjectDetailView } from '@/components/ProjectDetail/ProjectDetailView'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeCRMAmenities } from '@/utilities/crmAmenities'
import {
  fetchCRMProjectDetail,
  fetchCRMProjectRelatedProperties,
  normalizeCRMProject,
  PROPERTY_DETAIL_IMAGE_SIZE,
  type NormalizedCRMProject,
} from '@/utilities/crmProjects'
import { fetchCRMSimilarProjects } from '@/utilities/crmSimilarProjects'
import { resolveCRMPropertyDocuments } from '@/utilities/crmPropertyDocuments'
import type { Form } from '@/payload-types'
import {
  extractPropertyInquiryContext,
  type PropertyInquiryContext,
} from '@/utilities/propertyInquiry'
import { resolveCRMPropertyVideos } from '@/utilities/crmPropertyVideo'
import { extractReferenceFromSlug } from '@/utilities/propertyUrl'
import { useSiteLocale } from '@/utilities/useSiteLocale'
import { formatPageTitle } from '@/utilities/getAppName'

function ProjectDetailSkeleton() {
  return (
    <main className="bg-surface-cream pt-20 md:pt-24 lg:pt-28">
      <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <Skeleton className="aspect-[4/3] rounded-xl lg:col-span-7 xl:col-span-8" />
          <div className="space-y-6 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/80 p-6 lg:col-span-5 xl:col-span-4">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-8 w-40 rounded" />
            <Skeleton className="h-12 w-56 rounded" />
            <Skeleton className="h-32 w-full rounded" />
          </div>
        </div>
      </div>
    </main>
  )
}

type Props = {
  contactForm?: Form | null
}

export const ProjectDetailPageClient: React.FC<Props> = ({ contactForm }) => {
  const params = useParams<{ slug: string }>()
  const activeLocale = useSiteLocale()
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)
  const [project, setProject] = useState<ReturnType<typeof normalizeCRMProject> | null>(null)
  const [amenities, setAmenities] = useState<ReturnType<typeof normalizeCRMAmenities>>([])
  const [videos, setVideos] = useState<ReturnType<typeof resolveCRMPropertyVideos>>([])
  const [documents, setDocuments] = useState<ReturnType<typeof resolveCRMPropertyDocuments>>([])
  const [inquiry, setInquiry] = useState<PropertyInquiryContext>({})
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [relatedProjects, setRelatedProjects] = useState<NormalizedCRMProject[]>([])
  const [similarProjectsLoading, setSimilarProjectsLoading] = useState(false)

  const slug = decodeURIComponent(params.slug ?? '')

  useEffect(() => {
    if (!slug) {
      setNotFoundState(true)
      setLoading(false)
      return
    }

    const reference = extractReferenceFromSlug(slug)
    if (!reference) {
      setNotFoundState(true)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setNotFoundState(false)
      setRelatedProjects([])
      setSimilarProjectsLoading(false)

      try {
        const raw = await fetchCRMProjectDetail(reference, {
          locale: activeLocale,
          similarCommercials: 'exclude_similar',
          init: { signal: controller.signal },
        })
        if (controller.signal.aborted) return

        if (!raw) {
          setNotFoundState(true)
          return
        }

        // Pedro: separate commercial-construction fetch for Availability table units.
        const relatedProperties = await fetchCRMProjectRelatedProperties(reference, {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return

        const normalized = normalizeCRMProject(raw, activeLocale, {
          attachmentImageSize: PROPERTY_DETAIL_IMAGE_SIZE,
          relatedProperties,
        })

        setProject(normalized)
        setInquiry({
          ...extractPropertyInquiryContext(raw, {
            reference: normalized.reference,
            displayReference: normalized.displayReference,
            id: normalized.id,
          }),
          kind: 'project',
        })
        const detailSource = raw
        setVideos(resolveCRMPropertyVideos(detailSource, activeLocale))
        setDocuments(
          resolveCRMPropertyDocuments(detailSource, {
            locale: activeLocale,
            context: 'construction',
          }),
        )
        setAmenities(normalizeCRMAmenities(detailSource))
        setLatitude(normalized.latitude)
        setLongitude(normalized.longitude)
        document.title = formatPageTitle(normalized.title)

        setSimilarProjectsLoading(true)
        void (async () => {
          try {
            const similar = await fetchCRMSimilarProjects({
              project: normalized.raw ?? raw,
              limit: 5,
              locale: activeLocale,
              signal: controller.signal,
            })
            if (!controller.signal.aborted) setRelatedProjects(similar)
          } catch (similarError) {
            if ((similarError as Error).name !== 'AbortError') {
              console.error('Failed to load similar projects', similarError)
              if (!controller.signal.aborted) setRelatedProjects([])
            }
          } finally {
            if (!controller.signal.aborted) setSimilarProjectsLoading(false)
          }
        })()
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('Failed to load project detail', error)
        setNotFoundState(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [slug, activeLocale])

  if (loading) return <ProjectDetailSkeleton />
  if (notFoundState || !project) notFound()

  return (
    <ProjectDetailView
      contactForm={contactForm}
      inquiry={inquiry}
      project={project}
      amenities={amenities}
      videos={videos}
      documents={documents}
      latitude={latitude}
      longitude={longitude}
      relatedProjects={relatedProjects}
      similarProjectsLoading={similarProjectsLoading}
    />
  )
}
