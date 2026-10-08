'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bath, Bed, Clock, KeyRound, Plane, Ruler, Star, Waves } from 'lucide-react'

import { PropertyCardImageGallery } from '@/components/PropertyCard/PropertyCardImageGallery'
import { formatPropertyAreaDisplay } from '@/components/PropertyCard'
import { useProjectFavorites } from '@/providers/PropertyFavorites'
import type { FavoriteProjectId } from '@/utilities/propertyFavorites'
import type { NormalizedCRMProject, ProjectPhaseInfo } from '@/utilities/crmProjects'
import { getShownReference } from '@/settings/optimaCrm/shared'
import { useLocalizedPropertyPrice, useTranslation } from '@/utilities/translateClient'
import { cn } from '@/utilities/ui'
import { formatTitle } from '@/utilities/formateTitle'

type Props = {
  project: NormalizedCRMProject
  projectId?: FavoriteProjectId | null
  href?: string
  className?: string
  style?: React.CSSProperties
}

function PhaseSpecs({ phase }: { phase: ProjectPhaseInfo }) {
  const hasBeds = phase.bedrooms != null && phase.bedrooms > 0
  const hasBaths = phase.bathrooms != null && phase.bathrooms > 0
  const hasBuilt = phase.built != null && phase.built > 0

  if (!hasBeds && !hasBaths && !hasBuilt) return null

  const chipClassName =
    'inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-surface-sand/80 px-2.5 py-1 font-label-sm text-[11px] text-on-surface/70'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasBeds && (
        <span className={chipClassName}>
          <Bed size={13} className="text-secondary" aria-hidden />
          {phase.bedrooms}
          <span className="sr-only"> bedrooms</span>
        </span>
      )}
      {hasBaths && (
        <span className={chipClassName}>
          <Bath size={13} className="text-secondary" aria-hidden />
          {phase.bathrooms}
          <span className="sr-only"> bathrooms</span>
        </span>
      )}
      {hasBuilt && (
        <span className={chipClassName}>
          <Ruler size={13} className="text-secondary" aria-hidden />
          {Math.floor(phase.built!)}m²
        </span>
      )}
    </div>
  )
}

function PhaseRow({
  phase,
  phaseLabel,
  fromLabel,
}: {
  phase: ProjectPhaseInfo
  phaseLabel: string
  fromLabel: string
}) {
  return (
    <div className="space-y-2 border-b border-secondary/20 pb-2.5 last:border-b-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-label-sm text-[12px] text-on-surface">
          {phaseLabel} {phase.constructionPhase}
          {phase.priceFromLabel ? (
            <>
              {' '}
              {fromLabel}{' '}
              <span className="font-headline-md text-[1rem] font-light text-primary">
                {phase.priceFromLabel} €
              </span>
            </>
          ) : null}
        </p>
        {phase.quantity != null && (
          <span className="whitespace-nowrap font-label-sm text-[10px] uppercase tracking-[0.08em] text-on-surface/50">
            (x{phase.quantity})
          </span>
        )}
      </div>
      <PhaseSpecs phase={phase} />
    </div>
  )
}

export const ProjectCard: React.FC<Props> = ({
  project,
  projectId,
  href,
  className = '',
  style,
}) => {
  const { isFavorite, toggleFavorite } = useProjectFavorites()
  const favorited = projectId != null && projectId !== '' && isFavorite(projectId)
  const [showAllPhases, setShowAllPhases] = useState(false)

  const viewProjectLabel = useTranslation('projectList.card.viewProject', 'View Project')
  const refPrefixLabel = useTranslation('propertyList.card.refPrefix', 'Ref:')
  const addToFavoritesLabel = useTranslation('propertyList.card.addToFavorites', 'Add to favorites')
  const removeFromFavoritesLabel = useTranslation(
    'propertyList.card.removeFromFavorites',
    'Remove from favorites',
  )
  const phaseLabel = useTranslation('projectList.card.phase', 'Phase')
  const fromLabel = useTranslation('projectList.card.from', 'From')
  const seeAllOptionsLabel = useTranslation('projectList.card.seeAllOptions', 'See all options')
  const keyReadyLabel = useTranslation('projectList.card.keyReady', 'Key ready')
  const deliveryLabel = useTranslation('projectList.card.delivery', 'Delivery')
  const airportLabel = useTranslation('projectList.card.airport', 'Airport')
  const beachLabel = useTranslation('projectList.card.beach', 'Beach')
  const displayPrice = useLocalizedPropertyPrice(project.price)
  const shownReference = getShownReference(project)

  const visiblePhases = showAllPhases ? project.phases : project.phases.slice(0, 2)
  const hiddenPhaseCount = Math.max(0, project.phases.length - 2)

  const handleFavoritePointer = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleFavoritePointer(event)
    if (projectId == null || projectId === '') return
    toggleFavorite(projectId)
  }

  const viewButtonClassName =
    'mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md border border-secondary bg-secondary py-3 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)] transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary'

  const viewButton = href ? (
    <span className={viewButtonClassName}>
      {viewProjectLabel}
      <ArrowRight
        size={14}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </span>
  ) : null

  const cardInfo = (
    <div className="flex h-full flex-1 flex-col p-4 md:p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="truncate font-label-nav text-[10px] uppercase tracking-[0.18em] text-secondary">
          {project.location || project.city || ' '}
        </p>
        {shownReference ? (
          <span className="whitespace-nowrap rounded-md border border-secondary/20 bg-surface-sand/80 px-2 py-0.5 font-label-sm text-[10px] uppercase tracking-[0.08em] text-on-surface/55">
            {refPrefixLabel} {shownReference}
          </span>
        ) : null}
      </div>

      <h3 className="mb-3 line-clamp-2 min-h-[2.6em] font-headline-md text-[1.1rem] font-light leading-snug tracking-[0.01em] text-primary md:text-[1.2rem]">
        {project.title
          ? formatTitle(project.title)
          : ''}
      </h3>

      {(project.airportDistance || project.beachDistance) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {project.airportDistance && (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-surface-sand/80 px-2.5 py-1 font-label-sm text-[11px] text-on-surface/70"
              title={`${airportLabel}: ${project.airportDistance}`}
            >
              <Plane size={13} className="text-secondary" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">{airportLabel} </span>
              {project.airportDistance}
            </span>
          )}
          {project.beachDistance && (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-surface-sand/80 px-2.5 py-1 font-label-sm text-[11px] text-on-surface/70"
              title={`${beachLabel}: ${project.beachDistance}`}
            >
              <Waves size={13} className="text-secondary" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">{beachLabel} </span>
              {project.beachDistance}
            </span>
          )}
        </div>
      )}

      {visiblePhases.length > 0 ? (
        <div className="mb-4 space-y-2.5">
          {visiblePhases.map((phase, index) => (
            <PhaseRow
              key={`${phase.constructionPhase}-${index}`}
              phase={phase}
              phaseLabel={phaseLabel}
              fromLabel={fromLabel}
            />
          ))}
          {hiddenPhaseCount > 0 && !showAllPhases && (
            <button
              type="button"
              className="cursor-pointer font-label-sm text-[11px] text-secondary transition-colors hover:text-primary"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowAllPhases(true)
              }}
            >
              {seeAllOptionsLabel} (+{hiddenPhaseCount})
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {project.beds != null && project.beds > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-surface-sand/80 px-2.5 py-1 font-label-sm text-[11px] text-on-surface/70">
                <Bed size={13} className="text-secondary" aria-hidden />
                {project.beds}
              </span>
            )}
            {project.baths != null && project.baths > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-surface-sand/80 px-2.5 py-1 font-label-sm text-[11px] text-on-surface/70">
                <Bath size={13} className="text-secondary" aria-hidden />
                {project.baths}
              </span>
            )}
            {project.sqft ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-surface-sand/80 px-2.5 py-1 font-label-sm text-[11px] text-on-surface/70">
                <Ruler size={13} className="text-secondary" aria-hidden />
                {formatPropertyAreaDisplay(project.sqft)}
              </span>
            ) : null}
          </div>
          {displayPrice ? (
            <div className="mb-4 border-t border-secondary/25 pt-3">
              <div className="text-right">
                <span className="block font-headline-md text-[1.2rem] font-light text-primary md:text-[1.3rem]">
                  {displayPrice}
                </span>
              </div>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-auto space-y-3">
        {(project.isKeyReady || project.deliveryLabel) && (
          <div className="flex items-center gap-2 rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2.5">
            {project.isKeyReady ? (
              <>
                <KeyRound
                  size={15}
                  strokeWidth={1.75}
                  className="shrink-0 text-secondary"
                  aria-hidden
                />
                <span className="font-label-sm text-[11px] uppercase tracking-[0.1em] text-primary">
                  {keyReadyLabel}
                </span>
              </>
            ) : (
              <>
                <Clock
                  size={15}
                  strokeWidth={1.75}
                  className="shrink-0 text-secondary"
                  aria-hidden
                />
                <span className="font-label-sm text-[11px] text-on-surface/55">
                  {deliveryLabel}
                </span>
                <span className="font-label-sm text-[11px] font-medium text-primary">
                  {project.deliveryLabel}
                </span>
              </>
            )}
          </div>
        )}
        {viewButton}
      </div>
    </div>
  )

  const cardShellClass = cn(
    'group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-secondary/25 bg-surface-cream shadow-[0_22px_48px_-28px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-[0_28px_56px_-28px_rgba(0,0,0,0.28)] md:rounded-[1.75rem]',
    className,
  )

  return (
    <article className={cardShellClass} style={style}>
      <div className="relative h-[230px] shrink-0 overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24 after:bg-gradient-to-t after:from-primary/40 after:to-transparent sm:h-[250px] md:h-[280px]">
        <PropertyCardImageGallery
          title={project.title}
          imageUrls={project.imageUrls}
          imageUrl={project.imageUrl}
          href={href}
        />
        {projectId != null && projectId !== '' && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            onMouseDown={handleFavoritePointer}
            onPointerDown={handleFavoritePointer}
            aria-label={favorited ? removeFromFavoritesLabel : addToFavoritesLabel}
            aria-pressed={favorited}
            className="absolute top-3 left-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-secondary/50 bg-surface-cream/90 text-primary backdrop-blur-md transition-colors hover:border-secondary hover:bg-secondary hover:text-on-secondary"
          >
            <Star
              size={16}
              strokeWidth={1.75}
              className={favorited ? 'fill-secondary text-secondary' : 'fill-none'}
            />
          </button>
        )}
      </div>

      {href ? (
        <Link
          href={href}
          prefetch={false}
          className="relative z-10 flex flex-1 flex-col cursor-pointer text-inherit no-underline"
        >
          {cardInfo}
        </Link>
      ) : (
        cardInfo
      )}
    </article>
  )
}
