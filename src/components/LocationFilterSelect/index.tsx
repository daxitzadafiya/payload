'use client'

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Minus } from 'lucide-react'

import type { CRMLocationCity } from '@/utilities/crmLocations'
import {
  computeFloatingMenuStyle,
  type FloatingMenuPlacement,
} from '@/utilities/floatingMenuPosition'
import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  label: string
  tree: CRMLocationCity[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyLabel?: string
  id?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  loading?: boolean
  menuPlacement?: FloatingMenuPlacement
  icon?: React.ReactNode
}

const fieldLabelClass = 'font-label-sm text-label-sm uppercase text-on-surface-variant ml-1'

const defaultTriggerClass =
  'w-full pr-10 py-3 bg-surface-container-low border border-transparent focus:border-tertiary focus:ring-0 rounded-lg font-body-md text-body-md text-on-surface text-left'

const areaKey = (key: number) => String(key)

export const LocationFilterSelect: React.FC<Props> = ({
  label,
  tree,
  value,
  onChange,
  placeholder = 'Location',
  emptyLabel,
  id: idProp,
  className,
  triggerClassName,
  disabled = false,
  loading = false,
  menuPlacement = 'auto',
  icon,
}) => {
  const generatedId = useId()
  const triggerId = idProp ?? generatedId
  const listboxId = `${triggerId}-listbox`
  const loadingLocationsLabel = useTranslation(
    'propertyList.filters.loadingLocations',
    'Loading locations…',
  )
  const noLocationsLabel = useTranslation(
    'propertyList.filters.noLocations',
    'No locations available',
  )
  const selectedCountLabel = useTranslation(
    'propertyList.filters.locationsSelected',
    '{count} selected',
  )

  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedSet = useMemo(() => new Set(value), [value])

  const areaLabelByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const city of tree) {
      for (const area of city.areas) {
        map.set(areaKey(area.key), area.label)
      }
    }
    return map
  }, [tree])

  const displayLabel = useMemo(() => {
    if (loading) return loadingLocationsLabel
    if (tree.length === 0) return noLocationsLabel
    if (value.length === 0) return emptyLabel ?? placeholder

    const labels = value.map((key) => areaLabelByKey.get(key)).filter(Boolean) as string[]

    if (labels.length <= 2) return labels.join(', ')
    return selectedCountLabel.replace('{count}', String(labels.length))
  }, [
    areaLabelByKey,
    emptyLabel,
    loading,
    loadingLocationsLabel,
    noLocationsLabel,
    placeholder,
    selectedCountLabel,
    tree.length,
    value,
  ])

  const getCityAreaKeys = (city: CRMLocationCity) => city.areas.map((area) => areaKey(area.key))

  const getCitySelectionState = (city: CRMLocationCity): 'none' | 'partial' | 'all' => {
    const keys = getCityAreaKeys(city)
    if (keys.length === 0) return 'none'
    const selectedCount = keys.filter((key) => selectedSet.has(key)).length
    if (selectedCount === 0) return 'none'
    if (selectedCount === keys.length) return 'all'
    return 'partial'
  }

  const toggleCity = (city: CRMLocationCity) => {
    const keys = getCityAreaKeys(city)
    const state = getCitySelectionState(city)
    if (state === 'all') {
      onChange(value.filter((item) => !keys.includes(item)))
      return
    }
    const merged = new Set([...value, ...keys])
    onChange(Array.from(merged))
  }

  const toggleArea = (key: string) => {
    if (selectedSet.has(key)) {
      onChange(value.filter((item) => item !== key))
      return
    }
    onChange([...value, key])
  }

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = menuRef.current?.getBoundingClientRect().height ?? 0
      setMenuStyle(
        computeFloatingMenuStyle({
          triggerRect: rect,
          menuHeight,
          minWidth: 280,
          placement: menuPlacement,
        }),
      )
    }

    updatePosition()

    let resizeObserver: ResizeObserver | null = null
    const raf = requestAnimationFrame(() => {
      updatePosition()
      if (typeof ResizeObserver !== 'undefined' && menuRef.current) {
        resizeObserver = new ResizeObserver(updatePosition)
        resizeObserver.observe(menuRef.current)
      }
    })

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, tree.length, menuPlacement])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const menu = open ? (
    <div
      ref={menuRef}
      id={listboxId}
      role="listbox"
      aria-multiselectable
      aria-label={label}
      style={menuStyle}
      className={cn(
        'overflow-y-auto overscroll-contain rounded-lg border border-outline-variant/40',
        'bg-surface py-2 shadow-lg',
      )}
    >
      {tree.length === 0 ? (
        <p className="px-4 py-3 font-body-md text-body-md text-on-surface-variant">
          {loading ? loadingLocationsLabel : noLocationsLabel}
        </p>
      ) : (
        tree.map((city) => {
          const cityState = getCitySelectionState(city)

          return (
            <div key={city.key} className="py-0.5">
              <button
                type="button"
                role="option"
                aria-selected={cityState === 'all'}
                className="flex w-full items-center gap-2 px-4 py-2 cursor-pointer text-left font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleCity(city)}
              >
                <CheckboxIndicator state={cityState} />
                <span className="flex-1 truncate font-medium">{city.label}</span>
              </button>

              {city.areas.map((area) => {
                const key = areaKey(area.key)
                const selected = selectedSet.has(key)

                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className="flex w-full items-center cursor-pointer gap-2 py-2 pl-10 pr-4 text-left font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleArea(key)}
                  >
                    <CheckboxIndicator state={selected ? 'all' : 'none'} />
                    <span className="flex-1 truncate">{area.label}</span>
                  </button>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  ) : null

  return (
    <div ref={rootRef} className={cn('relative flex flex-col gap-2', className)}>
      <label className={fieldLabelClass} htmlFor={triggerId}>
        {label}
      </label>

      <button
        type="button"
        id={triggerId}
        disabled={disabled || loading || tree.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={cn(
          defaultTriggerClass,
          icon ? 'pl-10' : 'pl-4',
          'relative transition-colors cursor-pointer duration-200',
          (disabled || loading || tree.length === 0) && 'cursor-not-allowed opacity-60',
          open && 'border-tertiary',
          triggerClassName,
        )}
        onClick={() => setOpen((current) => !current)}
      >
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary flex items-center justify-center">
            {icon}
          </span>
        )}
        <span className="block truncate">{displayLabel}</span>
        <ChevronDown
          size={20}
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  )
}

const CheckboxIndicator: React.FC<{ state: 'none' | 'partial' | 'all' }> = ({ state }) => (
  <span
    className={cn(
      'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-outline-variant bg-surface',
      state === 'all' && 'border-primary bg-primary text-on-primary',
      state === 'partial' && 'border-primary bg-primary/15 text-primary',
    )}
    aria-hidden
  >
    {state === 'all' && <Check size={12} strokeWidth={3} />}
    {state === 'partial' && <Minus size={12} strokeWidth={3} />}
  </span>
)

export default LocationFilterSelect
