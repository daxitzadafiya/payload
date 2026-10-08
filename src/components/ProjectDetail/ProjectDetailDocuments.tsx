'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Download, FileText } from 'lucide-react'

import { useDocumentDownload } from '@/components/DocumentDownload/DocumentDownloadProvider'
import {
  downloadKindFromDocumentGroup,
  type DocumentDownloadKind,
} from '@/utilities/documentDownload'
import type { CRMPropertyDocumentGroup } from '@/utilities/crmPropertyDocuments'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  groups: CRMPropertyDocumentGroup[]
}

function DocumentMenu({
  label,
  urls,
  openLabel,
  kind,
}: {
  label: string
  urls: string[]
  openLabel: string
  kind: DocumentDownloadKind
}) {
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
      const estimatedItemHeight = 40
      const menuHeight = menuRef.current?.offsetHeight ?? urls.length * estimatedItemHeight + 2
      const gap = 4
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow
      const width = Math.max(rect.width, 180)

      setMenuStyle({
        position: 'fixed',
        left: Math.min(rect.left, window.innerWidth - width - 8),
        top: shouldOpenUp ? undefined : rect.bottom + gap,
        bottom: shouldOpenUp ? window.innerHeight - rect.top + gap : undefined,
        minWidth: width,
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
  }, [open, urls.length])

  if (urls.length === 1) {
    return (
      <button
        type="button"
        className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border border-secondary/35 bg-secondary/10 px-3 py-1.5 font-label-sm text-[11px] uppercase tracking-[0.12em] text-secondary transition-colors hover:bg-secondary hover:text-on-secondary"
        onClick={() =>
          requestDownload({
            url: urls[0],
            actionLabel: openLabel,
            documentLabel: label,
            kind,
          })
        }
      >
        <Download size={14} aria-hidden />
        {openLabel}
      </button>
    )
  }

  const menu = open && mounted && (
    <div
      ref={menuRef}
      style={menuStyle}
      className="overflow-hidden rounded-md border border-outline-variant/40 bg-surface-container-lowest shadow-lg"
      role="menu"
    >
      {urls.map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 border-b border-outline-variant/20 px-3 py-2.5 text-left text-label-sm text-on-surface last:border-b-0 hover:bg-surface-container-low"
          onClick={() => {
            setOpen(false)
            requestDownload({
              url,
              actionLabel: openLabel,
              documentLabel: `${label} ${index + 1}`,
              kind,
            })
          }}
        >
          <FileText size={14} className="shrink-0 text-on-surface-variant" aria-hidden />
          {label} {index + 1}
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
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-secondary/35 bg-secondary/10 px-3 py-1.5 font-label-sm text-[11px] uppercase tracking-[0.12em] text-secondary transition-colors hover:bg-secondary hover:text-on-secondary"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {openLabel}
        {urls.length > 1 ? (
          <span className="text-on-surface-variant">({urls.length})</span>
        ) : null}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  )
}

export const ProjectDetailDocuments: React.FC<Props> = ({ groups }) => {
  const heading = useTranslation('propertyDetail.documents.heading', 'Documents of interest')
  const floorPlansLabel = useTranslation('propertyDetail.documents.floorPlans', 'Floor plans')
  const qualityLabel = useTranslation('propertyDetail.documents.qualityReport', 'Quality report')
  const salesLabel = useTranslation('propertyDetail.documents.salesFile', 'Sales file')
  const otherLabel = useTranslation('propertyDetail.documents.other', 'Documents')
  const viewLabel = useTranslation('propertyDetail.documents.view', 'View')
  const downloadLabel = useTranslation('propertyDetail.documents.download', 'Download')
  const fileSingular = useTranslation('propertyDetail.documents.fileSingular', 'file')
  const filePlural = useTranslation('propertyDetail.documents.filePlural', 'files')

  if (groups.length === 0) return null

  const labelForKind = (kind: CRMPropertyDocumentGroup['kind'], fallback: string) => {
    switch (kind) {
      case 'floor_plan':
        return floorPlansLabel
      case 'quality_specification':
        return qualityLabel
      case 'sales_dossier':
        return salesLabel
      default:
        return otherLabel || fallback
    }
  }

  return (
    <section className="mb-10 md:mb-12">
      <div className="mb-8">
        <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
        <h2 className="m-0 font-headline-lg text-[clamp(1.65rem,2.5vw,2.25rem)] font-light tracking-[0.01em] text-primary">
          {heading}
        </h2>
      </div>

      <ul className="divide-y divide-secondary/15 overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-sand/50">
        {groups.map((group) => {
          const label = labelForKind(group.kind, group.label)
          const actionLabel = group.urls.length > 1 ? viewLabel : downloadLabel

          return (
            <li
              key={group.kind}
              className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <FileText size={18} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-body-md text-body-md font-medium text-on-surface">
                    {label}
                  </p>
                  <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    {group.urls.length}{' '}
                    {group.urls.length === 1 ? fileSingular : filePlural}
                  </p>
                </div>
              </div>

              <DocumentMenu
                kind={downloadKindFromDocumentGroup(group.kind)}
                label={label}
                openLabel={actionLabel}
                urls={group.urls}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
