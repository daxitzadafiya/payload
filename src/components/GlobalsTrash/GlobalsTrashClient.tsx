'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button,
  ChevronIcon,
  Pagination,
  PerPage,
  SearchFilter,
  SearchIcon,
  toast,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'

type TrashedItemRow = {
  deletedAt: string
  fieldLabel: string
  fieldPath: string
  globalLabel: string
  globalSlug: string
  itemId: string
  label: string
  locale?: string
}

type Props = {
  rows: TrashedItemRow[]
}

type SortKey = 'label' | 'globalLabel' | 'fieldLabel' | 'deletedAt'
type SortState = { key: SortKey; direction: 'asc' | 'desc' }

const DEFAULT_LIMIT = 10
const LIMITS = [5, 10, 25, 50, 100]
const DEFAULT_SORT: SortState = { key: 'deletedAt', direction: 'desc' }

const metaStyle: React.CSSProperties = {
  marginTop: 2,
  fontSize: '0.8125rem',
  opacity: 0.65,
}

function rowKey(row: TrashedItemRow): string {
  return `${row.globalSlug}:${row.fieldPath}:${row.locale || '_'}:${row.itemId}`
}

function compareRows(a: TrashedItemRow, b: TrashedItemRow, sort: SortState): number {
  const left = a[sort.key] ?? ''
  const right = b[sort.key] ?? ''
  const cmp = String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
  return sort.direction === 'asc' ? cmp : -cmp
}

function SortableColumnHeader({
  label,
  name,
  sort,
  onSort,
}: {
  label: string
  name: SortKey
  sort: SortState
  onSort: (next: SortState) => void
}) {
  const { t } = useTranslation()
  const ascActive = sort.key === name && sort.direction === 'asc'
  const descActive = sort.key === name && sort.direction === 'desc'

  return (
    <div className="sort-column">
      <span className="sort-column__label">{label}</span>
      <div className="sort-column__buttons">
        <button
          aria-label={t('general:sortByLabelDirection', {
            direction: t('general:ascending'),
            label,
          })}
          className={[
            'sort-column__asc',
            'sort-column__button',
            ascActive ? 'sort-column--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSort({ key: name, direction: 'asc' })}
          type="button"
        >
          <ChevronIcon direction="up" />
        </button>
        <button
          aria-label={t('general:sortByLabelDirection', {
            direction: t('general:descending'),
            label,
          })}
          className={[
            'sort-column__desc',
            'sort-column__button',
            descActive ? 'sort-column--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSort({ key: name, direction: 'desc' })}
          type="button"
        >
          <ChevronIcon />
        </button>
      </div>
    </div>
  )
}

function DeletedAtCell({ value }: { value: string }) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !value) {
    return <span suppressHydrationWarning>{'\u00a0'}</span>
  }

  const pattern = config.admin?.dateFormat || 'MMMM do yyyy, h:mm a'

  return (
    <span suppressHydrationWarning>
      {formatDate({
        date: value,
        i18n,
        pattern,
      })}
    </span>
  )
}

export function GlobalsTrashClient({ rows: initialRows }: Props) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  const apiBase = config.routes.api || '/api'
  const adminBase = config.routes.admin || '/admin'

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = !q
      ? rows
      : rows.filter((row) =>
          [row.label, row.globalLabel, row.globalSlug, row.fieldLabel, row.fieldPath, row.locale]
            .filter(Boolean)
            .some((part) => String(part).toLowerCase().includes(q)),
        )

    return [...filtered].sort((a, b) => compareRows(a, b, sort))
  }, [query, rows, sort])

  const totalDocs = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit) || 1)
  const safePage = Math.min(page, totalPages)
  const pagingCounter = (safePage - 1) * limit + 1
  const pageRows = filteredRows.slice((safePage - 1) * limit, safePage * limit)
  const hasNextPage = safePage < totalPages
  const hasPrevPage = safePage > 1

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage)
    }
  }, [page, safePage])

  const onSearchChange = useCallback((search: string) => {
    setQuery(search || '')
    setPage(1)
  }, [])

  const onSort = useCallback((next: SortState) => {
    setSort(next)
    setPage(1)
  }, [])

  const restoreItem = useCallback(
    async (row: TrashedItemRow) => {
      const key = rowKey(row)
      setBusyKey(key)
      try {
        const res = await fetch(`${apiBase}/trash/globals`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: row.globalSlug,
            action: 'restoreItem',
            fieldPath: row.fieldPath,
            itemId: row.itemId,
            locale: row.locale,
          }),
        })

        const json = (await res.json().catch(() => ({}))) as {
          errors?: { message?: string }[]
          message?: string
        }

        if (!res.ok) {
          throw new Error(json.errors?.[0]?.message || json.message || 'Restore failed')
        }

        setRows((prev) => prev.filter((item) => rowKey(item) !== key))
        toast.success('Item restored')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Restore failed')
      } finally {
        setBusyKey(null)
      }
    },
    [apiBase, router],
  )

  return (
    <>
      <div className="list-controls">
        <div className="search-bar">
          <SearchIcon />
          <SearchFilter handleChange={onSearchChange} label="Search by Item" />
        </div>
      </div>

      {totalDocs === 0 ? (
        <div className="no-results">
          <h3>{rows.length === 0 ? 'Nothing in trash' : 'No results found'}</h3>
          <p>
            {rows.length === 0
              ? 'Items removed from globals will show up here.'
              : 'No items match your search.'}
          </p>
        </div>
      ) : (
        <>
          <div className="table">
            <table cellPadding={0} cellSpacing={0}>
              <thead>
                <tr>
                  <th id="heading-item">
                    <SortableColumnHeader
                      label="Item"
                      name="label"
                      onSort={onSort}
                      sort={sort}
                    />
                  </th>
                  <th id="heading-global">
                    <SortableColumnHeader
                      label="Global"
                      name="globalLabel"
                      onSort={onSort}
                      sort={sort}
                    />
                  </th>
                  <th id="heading-field">
                    <SortableColumnHeader
                      label="Field"
                      name="fieldLabel"
                      onSort={onSort}
                      sort={sort}
                    />
                  </th>
                  <th id="heading-deleted">
                    <SortableColumnHeader
                      label="Deleted"
                      name="deletedAt"
                      onSort={onSort}
                      sort={sort}
                    />
                  </th>
                  <th id="heading-actions">{'\u00a0'}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const key = rowKey(row)
                  return (
                    <tr key={key} className="row">
                      <td className="cell-item">
                        <span style={{ fontWeight: 600 }}>{row.label}</span>
                        {row.locale ? <div style={metaStyle}>{row.locale}</div> : null}
                      </td>
                      <td className="cell-global">
                        <Link href={`${adminBase}/globals/${row.globalSlug}`}>
                          {row.globalLabel}
                        </Link>
                        <div style={metaStyle}>{row.globalSlug}</div>
                      </td>
                      <td className="cell-field">{row.fieldLabel}</td>
                      <td className="cell-deleted">
                        <DeletedAtCell value={row.deletedAt} />
                      </td>
                      <td className="cell-actions">
                        <Button
                          buttonStyle="secondary"
                          disabled={busyKey === key}
                          onClick={() => {
                            void restoreItem(row)
                          }}
                          size="small"
                        >
                          Restore
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="page-controls">
            <Pagination
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              limit={limit}
              nextPage={hasNextPage ? safePage + 1 : undefined}
              numberOfNeighbors={1}
              onChange={setPage}
              page={safePage}
              prevPage={hasPrevPage ? safePage - 1 : undefined}
              totalPages={totalPages}
            />
            {totalDocs > 0 ? (
              <>
                <div className="page-controls__page-info">
                  {pagingCounter}-{Math.min(safePage * limit, totalDocs)} {i18n.t('general:of')}{' '}
                  {totalDocs}
                </div>
                <PerPage
                  handleChange={(nextLimit) => {
                    setLimit(nextLimit)
                    setPage(1)
                  }}
                  limit={limit}
                  limits={LIMITS}
                  resetPage={totalDocs <= pagingCounter}
                />
              </>
            ) : null}
          </div>
        </>
      )}
    </>
  )
}
