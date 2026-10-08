'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Link2 } from 'lucide-react'

import { useDocumentDownload } from '@/components/DocumentDownload/DocumentDownloadProvider'
import type { ProjectAvailabilityPhase, ProjectAvailabilityUnit } from '@/utilities/crmProjects'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  phases: ProjectAvailabilityPhase[]
}

type TableLabels = {
  dwelling: string
  reference: string
  status: string
  delivery: string
  price: string
  bedrooms: string
  bathrooms: string
  surface: string
  pool: string
  terrace: string
  garage: string
  plans: string
  link: string
}

function BoolIcon({ value }: { value: boolean }) {
  if (value) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect width="20" height="20" rx="10" fill="#A6D9C9" />
        <path
          d="M5.25 9.5L8.75 13L14.75 7"
          stroke="#2CA87F"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect width="20" height="20" rx="10" fill="#fc9090" />
      <path d="M7 7L13 13" stroke="#FF0000" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13 7L7 13" stroke="#FF0000" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PlansDropdown({ floorPlans, plansLabel }: { floorPlans: string[]; plansLabel: string }) {
  const { requestDownload } = useDocumentDownload()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const estimatedItemHeight = 36
      const menuHeight =
        menuRef.current?.offsetHeight ?? floorPlans.length * estimatedItemHeight + 2
      const gap = 4
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow

      setMenuStyle({
        position: 'fixed',
        left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 128) - 8),
        top: shouldOpenUp ? undefined : rect.bottom + gap,
        bottom: shouldOpenUp ? window.innerHeight - rect.top + gap : undefined,
        minWidth: Math.max(rect.width, 128),
        zIndex: 80,
      })
    }

    updatePosition()

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, floorPlans.length])

  if (floorPlans.length === 0) {
    return <span className="text-on-surface-variant">—</span>
  }

  const menu = open && mounted && (
    <div
      ref={menuRef}
      style={menuStyle}
      className="overflow-hidden rounded-md border border-outline-variant/40 bg-surface-container-lowest shadow-lg"
      role="menu"
    >
      {floorPlans.map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          role="menuitem"
          className="block w-full cursor-pointer border-b border-outline-variant/20 px-3 py-2 text-left text-label-sm text-on-surface last:border-b-0 hover:bg-surface-container-low"
          onClick={() => {
            setOpen(false)
            requestDownload({
              url,
              actionLabel: plansLabel,
              documentLabel: `${plansLabel} ${index + 1}`,
              kind: 'plan',
            })
          }}
        >
          {plansLabel} {index + 1}
        </button>
      ))}
    </div>
  )

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-label-sm font-label-sm text-on-surface transition-colors hover:bg-surface-container"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {plansLabel}
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-on-surface-variant">—</span>
  return (
    <span className="inline-flex rounded-md bg-sky-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-sky-900">
      {status}
    </span>
  )
}

/** Mobile / tablet: stacked unit cards — no horizontal page scroll. */
function UnitCard({ unit, labels }: { unit: ProjectAvailabilityUnit; labels: TableLabels }) {
  const terraceLabel =
    unit.terrace != null && String(unit.terrace).trim() !== '' ? `${unit.terrace} m²` : '—'

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: labels.reference, value: unit.reference || '—' },
    { label: labels.status, value: <StatusBadge status={unit.status} /> },
    { label: labels.delivery, value: unit.deliveryLabel || '—' },
    {
      label: labels.price,
      value: (
        <span className="font-semibold text-primary">
          {unit.priceLabel !== '—' ? `${unit.priceLabel} €` : '—'}
        </span>
      ),
    },
    { label: labels.bedrooms, value: unit.bedrooms ?? '—' },
    { label: labels.bathrooms, value: unit.bathrooms ?? '—' },
    { label: labels.surface, value: unit.built != null ? `${unit.built} m²` : '—' },
    { label: labels.terrace, value: terraceLabel },
    {
      label: labels.pool,
      value: (
        <span className="inline-flex items-center gap-1.5">
          <BoolIcon value={unit.pool} />
          <span className="sr-only">{unit.pool ? 'Yes' : 'No'}</span>
        </span>
      ),
    },
    {
      label: labels.garage,
      value: (
        <span className="inline-flex items-center gap-1.5">
          <BoolIcon value={unit.garage} />
          <span className="sr-only">{unit.garage ? 'Yes' : 'No'}</span>
        </span>
      ),
    },
  ]

  return (
    <article className="rounded-[1.25rem] border border-secondary/25 bg-surface-cream p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.18)] md:rounded-[1.5rem]">
      <div className="mb-4 flex items-start gap-3">
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
          {unit.imageUrl ? (
            <Image
              src={unit.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-label-sm text-on-surface-variant">
              —
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-headline-sm text-headline-sm text-primary">
            {unit.type || unit.reference || 'Unit'}
          </p>
          {unit.reference ? (
            <p className="mt-0.5 text-body-sm font-body-sm text-on-surface-variant">
              {labels.reference}: {unit.reference}
            </p>
          ) : null}
        </div>
        {unit.detailHref ? (
          <Link
            href={unit.detailHref}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
            aria-label={`${labels.link} ${unit.reference}`}
          >
            <Link2 size={18} />
          </Link>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
              {fact.label}
            </dt>
            <dd className="mt-1 text-body-sm font-body-sm text-on-surface">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-3">
        <span className="text-label-sm font-label-sm text-on-surface-variant">{labels.plans}</span>
        <PlansDropdown floorPlans={unit.floorPlans} plansLabel={labels.plans} />
      </div>
    </article>
  )
}

/** Desktop table row — lives inside a contained horizontal scroller only. */
function UnitTableRow({
  unit,
  labels,
}: {
  unit: ProjectAvailabilityUnit
  labels: Pick<TableLabels, 'plans' | 'link'>
}) {
  const terraceLabel =
    unit.terrace != null && String(unit.terrace).trim() !== '' ? `${unit.terrace} m²` : '—'

  return (
    <tr className="group border-b border-outline-variant/15 transition-colors last:border-b-0 hover:bg-surface-container-low/60">
      <td className="sticky left-0 z-10 bg-surface-container-lowest px-3 py-3 text-left shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] group-hover:bg-surface-sand">
        <div className="relative h-12 w-16 overflow-hidden rounded-md bg-surface-container-low">
          {unit.imageUrl ? (
            <Image
              src={unit.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3 text-center text-body-sm whitespace-nowrap">
        {unit.reference || '—'}
      </td>
      <td className="px-3 py-3 text-center">
        <StatusBadge status={unit.status} />
      </td>
      <td className="px-3 py-3 text-center text-body-sm whitespace-nowrap">
        {unit.deliveryLabel || '—'}
      </td>
      <td className="px-3 py-3 text-center text-body-sm font-medium whitespace-nowrap">
        {unit.priceLabel !== '—' ? `${unit.priceLabel} €` : '—'}
      </td>
      <td className="px-3 py-3 text-center text-body-sm">{unit.bedrooms ?? '—'}</td>
      <td className="px-3 py-3 text-center text-body-sm">{unit.bathrooms ?? '—'}</td>
      <td className="px-3 py-3 text-center text-body-sm whitespace-nowrap">
        {unit.built != null ? `${unit.built} m²` : '—'}
      </td>
      <td className="px-3 py-3">
        <div className="flex justify-center">
          <BoolIcon value={unit.pool} />
        </div>
      </td>
      <td className="px-3 py-3 text-center text-body-sm whitespace-nowrap">{terraceLabel}</td>
      <td className="px-3 py-3">
        <div className="flex justify-center">
          <BoolIcon value={unit.garage} />
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <PlansDropdown floorPlans={unit.floorPlans} plansLabel={labels.plans} />
      </td>
      <td className="px-3 py-3 text-center">
        {unit.detailHref ? (
          <Link
            href={unit.detailHref}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            aria-label={`${labels.link} ${unit.reference}`}
          >
            <Link2 size={18} />
          </Link>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}

export const ProjectDetailAvailability: React.FC<Props> = ({ phases }) => {
  const heading = useTranslation('projectDetail.availability.heading', 'Availability and price')
  const moreInfoLabel = useTranslation('projectDetail.availability.moreInfo', 'More information')
  const fromLabel = useTranslation('projectList.card.from', 'From')
  const bedroomsLabel = useTranslation('propertyDetail.specs.bedrooms', 'Bedrooms')
  const bathroomsLabel = useTranslation('propertyDetail.specs.bathrooms', 'Bathrooms')
  const scrollHint = useTranslation(
    'projectDetail.availability.scrollHint',
    'Scroll sideways to see all columns',
  )

  const tableLabels: TableLabels = {
    dwelling: useTranslation('projectDetail.availability.dwelling', 'Dwelling'),
    reference: useTranslation('projectDetail.availability.reference', 'Reference'),
    status: useTranslation('projectDetail.availability.status', 'Active stage'),
    delivery: useTranslation('projectDetail.availability.delivery', 'Delivery'),
    price: useTranslation('projectDetail.availability.price', 'Price'),
    bedrooms: bedroomsLabel,
    bathrooms: bathroomsLabel,
    surface: useTranslation('projectDetail.availability.surface', 'Surface'),
    pool: useTranslation('projectDetail.availability.pool', 'Pool'),
    terrace: useTranslation('projectDetail.availability.terrace', 'Terrace'),
    garage: useTranslation('projectDetail.availability.garage', 'Garage'),
    plans: useTranslation('projectDetail.availability.plans', 'Plans'),
    link: useTranslation('projectDetail.availability.link', 'Link'),
  }

  const [openPhaseIds, setOpenPhaseIds] = useState<Set<string>>(
    () => new Set(phases.length > 0 ? [phases[0].phaseId] : []),
  )

  if (phases.length === 0) return null

  const togglePhase = (phaseId: string) => {
    setOpenPhaseIds((current) => {
      const next = new Set(current)
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }

  return (
    <section id="availability-and-price" className="w-full max-w-full">
      <div className="mb-8 md:mb-10">
        <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
        <h2 className="m-0 font-headline-lg text-[clamp(1.65rem,2.5vw,2.25rem)] font-light tracking-[0.01em] text-primary">
          {heading}
        </h2>
      </div>

      <div className="flex w-full max-w-full flex-col gap-6 md:gap-8">
        {phases.map((phase) => {
          const isOpen = openPhaseIds.has(phase.phaseId)
          const summaryType = phase.type || phase.units[0]?.type || 'Apartment'
          const minPriceDisplay = phase.minPriceLabel || ''

          return (
            <div
              key={phase.phaseId}
              className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-secondary/25 bg-surface-cream shadow-[0_28px_60px_-32px_rgba(0,0,0,0.22)] md:rounded-[1.75rem]"
            >
              {phase.phaseName && phase.phaseId !== 'all' ? (
                <div className="border-b border-secondary/15 bg-surface-sand/70 px-4 py-4 md:px-6 md:py-5">
                  <h3 className="font-headline-sm text-xl font-light text-primary md:text-2xl">
                    {phase.phaseName}
                  </h3>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => togglePhase(phase.phaseId)}
                className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-container-low/50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 md:px-6"
                aria-expanded={isOpen}
              >
                <span className="min-w-0 font-body-md text-body-md font-medium text-on-surface sm:basis-[12%]">
                  {summaryType}
                </span>
                {phase.bedroomsRange ? (
                  <span className="font-body-md text-body-md text-on-surface sm:basis-[14%]">
                    {phase.bedroomsRange} {bedroomsLabel}
                  </span>
                ) : null}
                {phase.bathroomsRange ? (
                  <span className="font-body-md text-body-md text-on-surface sm:basis-[14%]">
                    {phase.bathroomsRange} {bathroomsLabel}
                  </span>
                ) : null}
                {minPriceDisplay ? (
                  <span className="font-body-md text-body-md font-medium text-primary sm:basis-[18%]">
                    {fromLabel} {minPriceDisplay} €
                  </span>
                ) : null}

                <span className="mt-1 inline-flex w-fit items-center gap-2 sm:ml-auto sm:mt-0">
                  <span className="inline-flex items-center justify-center rounded-md bg-surface-container px-3.5 py-2 text-label-sm font-semibold text-on-surface-variant">
                    {moreInfoLabel}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-outline-variant/25">
                  {/* Mobile & tablet: cards */}
                  <div className="space-y-3 p-4 lg:hidden">
                    {phase.units.map((unit, index) => (
                      <UnitCard
                        key={`${phase.phaseId}-card-${unit.reference}-${index}`}
                        unit={unit}
                        labels={tableLabels}
                      />
                    ))}
                  </div>

                  {/* Desktop: contained table scroll (page itself never overflows) */}
                  <div className="relative hidden lg:block">
                    <p className="sr-only">{scrollHint}</p>
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-linear-to-l from-surface-bright to-transparent" />
                    <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                      <table className="w-full min-w-[960px] border-collapse text-on-surface">
                        <thead>
                          <tr className="border-b border-outline-variant/30 bg-surface-container-low text-center text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
                            <th className="sticky left-0 z-10 bg-surface-container-low px-3 py-3 text-left shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                              {tableLabels.dwelling}
                            </th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.reference}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.status}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.delivery}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.price}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.bedrooms}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.bathrooms}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.surface}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.pool}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.terrace}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.garage}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.plans}</th>
                            <th className="px-3 py-3 whitespace-nowrap">{tableLabels.link}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phase.units.map((unit, index) => (
                            <UnitTableRow
                              key={`${phase.phaseId}-row-${unit.reference}-${index}`}
                              unit={unit}
                              labels={{ plans: tableLabels.plans, link: tableLabels.link }}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
