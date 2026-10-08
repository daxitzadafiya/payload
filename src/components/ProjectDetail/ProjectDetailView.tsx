'use client'

import Link from 'next/link'
import React from 'react'
import { Clock, KeyRound, MapPin } from 'lucide-react'

import { DocumentDownloadProvider } from '@/components/DocumentDownload/DocumentDownloadProvider'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { DetailDescription } from '@/components/DetailDescription'
import { DetailReference } from '@/components/DetailReference'
import { DetailSummaryPanel } from '@/components/DetailSummaryPanel'
import {
  PropertyDetailFavoriteButton,
  PropertyDetailFooterActions,
} from '@/components/PropertyDetail/PropertyDetailActions'
import { PropertyDetailAmenities } from '@/components/PropertyDetail/PropertyDetailAmenities'
import { PropertyDetailGallery } from '@/components/PropertyDetail/PropertyDetailGallery'
import { PropertyDetailInquiryForm } from '@/components/PropertyDetail/PropertyDetailInquiryForm'
import { PropertyDetailMap } from '@/components/PropertyDetail/PropertyDetailMap'
import { PropertyDetailSpecs } from '@/components/PropertyDetail/PropertyDetailSpecs'
import { PropertyDetailVideo } from '@/components/PropertyDetail/PropertyDetailVideo'
import { ProjectDetailAvailability } from '@/components/ProjectDetail/ProjectDetailAvailability'
import { ProjectDetailDocuments } from '@/components/ProjectDetail/ProjectDetailDocuments'
import { ProjectDetailRelated } from '@/components/ProjectDetail/ProjectDetailRelated'
import type { CRMAmenity } from '@/utilities/crmAmenities'
import type { CRMPropertyDocumentGroup } from '@/utilities/crmPropertyDocuments'
import type { CRMPropertyVideoItem } from '@/utilities/crmPropertyVideo'
import type { Form } from '@/payload-types'
import type { NormalizedCRMProject } from '@/utilities/crmProjects'
import type { PropertyInquiryContext } from '@/utilities/propertyInquiry'
import { useLocalizedPropertyPrice, useTranslation } from '@/utilities/translateClient'
import { formatTitle } from '@/utilities/formateTitle'

type Props = {
  contactForm?: Form | null
  inquiry: PropertyInquiryContext
  project: NormalizedCRMProject
  amenities: CRMAmenity[]
  videos?: CRMPropertyVideoItem[]
  documents?: CRMPropertyDocumentGroup[]
  latitude?: number
  longitude?: number
  portfolioHref?: string
  relatedProjects?: NormalizedCRMProject[]
  similarProjectsLoading?: boolean
}

export const ProjectDetailView: React.FC<Props> = ({
  contactForm,
  inquiry,
  project,
  amenities,
  videos = [],
  documents = [],
  latitude,
  longitude,
  portfolioHref = '/projects',
  relatedProjects = [],
  similarProjectsLoading = false,
}) => {
  const homeLabel = useTranslation('homeLabel', 'Home')
  const projectsLabel = useTranslation('projectDetail.breadcrumb.projects', 'Projects')
  const refPrefixLabel = useTranslation('propertyDetail.map.refPrefix', 'Ref:')
  const keyReadyLabel = useTranslation('projectList.card.keyReady', 'Key ready')
  const deliveryLabel = useTranslation('projectList.card.delivery', 'Delivery')
  const phaseLabel = useTranslation('projectList.card.phase', 'Phase')
  const fromLabel = useTranslation('projectList.card.from', 'From')
  const phasesHeading = useTranslation('projectDetail.phasesHeading', 'Available options')
  const unitsLabel = useTranslation('projectDetail.specs.units', 'Units')
  const priceLabel = useTranslation('propertyDetail.specs.price', 'Price')
  const bedroomsLabel = useTranslation('propertyDetail.specs.bedrooms', 'Bedrooms')
  const bathroomsLabel = useTranslation('propertyDetail.specs.bathrooms', 'Bathrooms')
  const livingAreaLabel = useTranslation('propertyDetail.specs.livingArea', 'Living Area')
  const bedroomSingular = useTranslation('propertyDetail.specs.bedroomSingular', 'Bedroom')
  const bedroomPlural = useTranslation('propertyDetail.specs.bedroomPlural', 'Bedrooms')
  const bathSingular = useTranslation('propertyDetail.specs.bathSingular', 'Bath')
  const bathPlural = useTranslation('propertyDetail.specs.bathPlural', 'Baths')
  const displayPrice = useLocalizedPropertyPrice(project.price)

  const locationSubtitle = [project.city, project.location]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')
  const galleryImages = project.imageUrls ?? (project.imageUrl ? [project.imageUrl] : [])
  const totalUnits = project.phases.reduce((sum, phase) => sum + (phase.quantity ?? 0), 0)

  const specItems = [
    project.beds != null
      ? {
          icon: 'bed',
          label: bedroomsLabel,
          value: `${project.beds} ${project.beds === 1 ? bedroomSingular : bedroomPlural}`,
        }
      : null,
    project.baths != null
      ? {
          icon: 'bathtub',
          label: bathroomsLabel,
          value: `${project.baths} ${project.baths === 1 ? bathSingular : bathPlural}`,
        }
      : null,
    project.isKeyReady
      ? { icon: 'check_circle', label: deliveryLabel, value: keyReadyLabel }
      : project.deliveryLabel
        ? { icon: 'check_circle', label: deliveryLabel, value: project.deliveryLabel }
        : null,
    project.price ? { icon: 'price', label: priceLabel, value: displayPrice } : null,
    totalUnits > 0 ? { icon: 'basement', label: unitsLabel, value: String(totalUnits) } : null,
    project.sqft
      ? { icon: 'straighten', label: livingAreaLabel, value: String(project.sqft) }
      : null,
  ].filter((item): item is { icon: string; label: string; value: string } => Boolean(item))

  return (
    <DocumentDownloadProvider
      contactForm={contactForm}
      heroImageUrl={project.imageUrl}
      inquiry={inquiry}
    >
    <main className="relative overflow-hidden bg-surface-cream pt-20 text-on-surface md:pt-24 lg:pt-28">
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -left-[22%] top-[18%] h-[36%] w-[42%] opacity-40 max-lg:hidden"
      />

      <section className="relative mx-auto mb-12 grid max-w-max-width grid-cols-1 items-start gap-8 px-margin-mobile md:mb-16 md:px-margin-desktop lg:grid-cols-12 lg:gap-x-10 xl:gap-x-14">
        <div className="lg:col-span-7 xl:col-span-8">
          <PropertyDetailGallery images={galleryImages} title={project.title} />
        </div>

        <DetailSummaryPanel>
          <nav className="mb-6 flex flex-wrap gap-x-1.5 font-label-nav text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/80">
            <Link className="transition-colors hover:text-secondary" href="/">
              {homeLabel}
            </Link>
            <span aria-hidden>/</span>
            <Link className="transition-colors hover:text-secondary" href={portfolioHref}>
              {projectsLabel}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-on-surface/70">{project.location}</span>
          </nav>

          <div className="mb-3 flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-headline-lg text-[clamp(1.75rem,2.4vw,2.35rem)] font-light leading-[1.12] tracking-[0.01em] text-primary">
              {project.title
                ? formatTitle(project.title)
                : ''}
            </h1>
            {project.id ? (
              <PropertyDetailFavoriteButton
                propertyId={project.id}
                kind="project"
                size="compact"
              />
            ) : null}
          </div>

          {locationSubtitle ? (
            <p className="mb-4 flex items-center gap-1.5 font-body-md text-[14px] italic text-on-surface-variant">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
              <span>{locationSubtitle}</span>
            </p>
          ) : null}

          <DetailReference
            prefix={refPrefixLabel}
            reference={project.displayReference || project.reference || ''}
            className="mb-6"
          />

          {displayPrice ? (
            <div className="mb-5">
              <p className="mb-1.5 font-label-nav text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                {fromLabel}
              </p>
              <p className="m-0 font-headline-md text-[clamp(1.65rem,2.2vw,2rem)] font-light leading-none text-secondary">
                {displayPrice}
              </p>
            </div>
          ) : null}

          {(project.beds != null ||
            project.baths != null ||
            project.isKeyReady ||
            project.deliveryLabel ||
            totalUnits > 0) && (
            <ul className="mb-1 flex flex-wrap gap-2">
              {project.beds != null ? (
                <li className="rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  {project.beds} {project.beds === 1 ? bedroomSingular : bedroomPlural}
                </li>
              ) : null}
              {project.baths != null ? (
                <li className="rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  {project.baths} {project.baths === 1 ? bathSingular : bathPlural}
                </li>
              ) : null}
              {project.isKeyReady ? (
                <li className="inline-flex items-center gap-1.5 rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  <KeyRound size={12} className="text-secondary" aria-hidden />
                  {keyReadyLabel}
                </li>
              ) : project.deliveryLabel ? (
                <li className="inline-flex items-center gap-1.5 rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  <Clock size={12} className="text-secondary" aria-hidden />
                  {project.deliveryLabel}
                </li>
              ) : null}
              {totalUnits > 0 ? (
                <li className="rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  {totalUnits} {unitsLabel}
                </li>
              ) : null}
            </ul>
          )}

          <PropertyDetailFooterActions />
        </DetailSummaryPanel>
      </section>

      <DetailDescription description={project.description} />

      <PropertyDetailSpecs items={specItems} />

      <section className="relative mx-auto mb-16 max-w-max-width px-margin-mobile md:mb-24 md:px-margin-desktop">
        <div className="grid grid-cols-1 gap-12 md:gap-16 lg:grid-cols-3 lg:gap-16 xl:gap-20">
        <div className="lg:col-span-2 space-y-12">
          <PropertyDetailAmenities amenities={amenities} />
          <ProjectDetailDocuments groups={documents} />

          {project.availabilityPhases.length === 0 && project.phases.length > 0 ? (
            <div>
              <div className="mb-8">
                <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
                <h2 className="m-0 font-headline-lg text-[clamp(1.65rem,2.5vw,2.25rem)] font-light tracking-[0.01em] text-primary">
                  {phasesHeading}
                </h2>
              </div>
              <ul className="space-y-0 overflow-hidden rounded-[1.5rem] border border-secondary/25 bg-surface-sand/70 md:rounded-[1.75rem]">
                {project.phases.map((phase, index) => (
                  <li
                    key={`${phase.constructionPhase}-${index}`}
                    className="flex items-start justify-between gap-4 border-b border-secondary/15 px-5 py-4 last:border-b-0 md:px-6"
                  >
                    <div>
                      <p className="font-body-md text-body-md text-on-surface">
                        {phaseLabel} {phase.constructionPhase} {fromLabel}{' '}
                        <span className="font-light text-secondary">
                          {phase.priceFromLabel ? `${phase.priceFromLabel} €` : '—'}
                        </span>
                      </p>
                      <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                        {[
                          phase.bedrooms != null ? `${phase.bedrooms} rooms` : null,
                          phase.bathrooms != null ? `${phase.bathrooms} baths` : null,
                          phase.built != null ? `${Math.floor(phase.built)}m²` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {phase.quantity != null && (
                      <span className="whitespace-nowrap rounded-md border border-secondary/25 bg-surface-cream px-2.5 py-1 font-label-sm text-[10px] uppercase tracking-[0.12em] text-secondary">
                        ×{phase.quantity}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1" id="property-inquiry">
          <PropertyDetailInquiryForm
            contactForm={contactForm}
            inquiry={inquiry}
            propertyTitle={project.title}
          />
        </div>
        </div>
      </section>

      {project.availabilityPhases.length > 0 && (
        <section className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-16 md:mb-24 w-full overflow-x-hidden">
          <ProjectDetailAvailability phases={project.availabilityPhases} />
        </section>
      )}

      {videos.length > 0 && <PropertyDetailVideo videos={videos} propertyTitle={project.title} />}

      {latitude != null && longitude != null && (
        <PropertyDetailMap
          latitude={latitude}
          longitude={longitude}
          title={project.title}
          locationLabel={locationSubtitle || project.location}
          description={
            project.displayReference || project.reference
              ? `${refPrefixLabel} ${project.displayReference || project.reference}`
              : undefined
          }
        />
      )}

      {/* <ProjectDetailRelated projects={relatedProjects} loading={similarProjectsLoading} /> */}
    </main>
    </DocumentDownloadProvider>
  )
}
