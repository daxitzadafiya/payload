'use client'

import { toast, useConfig, useDocumentInfo, useFormModified, useLocale } from '@payloadcms/ui'
import { Languages } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { isLexicalRichText, lexicalPlainText } from './lexicalText'

import './ForceTranslateControl.scss'

type ForceTranslateMeta = {
  enabled: boolean
  sourceLanguage: string
  targets: Array<{ code: string; label: string }>
}

type ForceTranslateResult = {
  succeeded?: string[]
  failed?: Array<{ locale: string; error: string }>
  error?: string
}

type Props = {
  path?: string
}

const ALL_VALUE = '__all__'

let metaCache: { api: string; promise: Promise<ForceTranslateMeta | null> } | null = null

function loadMeta(apiBase: string): Promise<ForceTranslateMeta | null> {
  if (!metaCache || metaCache.api !== apiBase) {
    metaCache = {
      api: apiBase,
      promise: fetch(`${apiBase}/force-translate/meta`, { credentials: 'include' })
        .then(async (response) => {
          if (!response.ok) return null
          return (await response.json()) as ForceTranslateMeta
        })
        .catch(() => null),
    }
  }
  return metaCache.promise
}

function hasSourceContent(value: unknown): boolean {
  if (typeof value === 'string') return Boolean(value.trim())
  if (isLexicalRichText(value)) return Boolean(lexicalPlainText(value))
  return false
}

function formatSuccess(result: ForceTranslateResult): string {
  const succeeded = result.succeeded ?? []
  const failed = result.failed ?? []
  if (succeeded.length === 0) return result.error || 'Translation failed'

  const successLabel =
    succeeded.length === 1
      ? `Translated to ${succeeded[0]}`
      : `Translated to ${succeeded.length} languages (${succeeded.join(', ')})`

  if (failed.length === 0) return successLabel
  return `${successLabel}. Failed: ${failed.map((item) => `${item.locale} (${item.error})`).join('; ')}`
}

export function ForceTranslateControl({ path }: Props) {
  const { config } = useConfig()
  const locale = useLocale()
  const modified = useFormModified()
  const { id, collectionSlug, globalSlug, hasSavePermission, data } = useDocumentInfo()
  const apiBase = config.routes.api || '/api'

  const [meta, setMeta] = useState<ForceTranslateMeta | null>(null)
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(ALL_VALUE)
  const [loading, setLoading] = useState(false)
  const inFlightRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void loadMeta(apiBase).then((next) => {
      if (!cancelled) setMeta(next)
    })
    return () => {
      cancelled = true
    }
  }, [apiBase])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
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

  const currentLocale = typeof locale?.code === 'string' ? locale.code : ''
  const savedValue = useMemo(() => {
    if (!path || !data) return undefined
    return path.split('.').reduce<unknown>((node, segment) => {
      if (node == null) return undefined
      if (Array.isArray(node)) {
        const index = Number(segment)
        if (Number.isInteger(index)) return node[index]
        return node.find(
          (item) =>
            item && typeof item === 'object' && String((item as { id?: unknown }).id) === segment,
        )
      }
      if (typeof node !== 'object') return undefined
      return (node as Record<string, unknown>)[segment]
    }, data)
  }, [data, path])

  const visible =
    Boolean(path) &&
    Boolean(meta?.enabled) &&
    currentLocale === meta?.sourceLanguage &&
    hasSavePermission !== false &&
    Boolean(collectionSlug || globalSlug) &&
    (collectionSlug ? id != null : true) &&
    hasSourceContent(savedValue)

  const handleTranslate = useCallback(async () => {
    if (!path || !meta || inFlightRef.current) return

    if (modified) {
      toast.info('Save the document first, then use Force Translate.')
      return
    }

    const payload: Record<string, unknown> = {
      path,
      target: target === ALL_VALUE ? 'all' : target,
    }
    if (collectionSlug) {
      payload.collection = collectionSlug
      payload.id = id
      payload.draft = data && typeof data === 'object' && (data as { _status?: string })._status !== 'published'
    } else if (globalSlug) {
      payload.global = globalSlug
    }

    inFlightRef.current = true
    setLoading(true)
    try {
      await toast.promise(
        (async () => {
          const response = await fetch(`${apiBase}/force-translate`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const result = (await response.json().catch(() => ({}))) as ForceTranslateResult
          if (!response.ok) {
            throw new Error(result.error || result.failed?.[0]?.error || 'Translation failed')
          }
          return result
        })(),
        {
          loading: 'Translating with DeepL…',
          success: (result) => formatSuccess(result),
          error: (error) => (error instanceof Error ? error.message : 'Translation failed'),
        },
      )
      setOpen(false)
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [apiBase, collectionSlug, data, globalSlug, id, meta, modified, path, target])

  if (!visible) return null

  const selectId = `force-translate-${path}`

  return (
    <div className="force-translate" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className="force-translate__trigger"
        disabled={loading}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Languages aria-hidden size={13} strokeWidth={2.25} />
        <span>{loading ? 'Translating…' : 'Force Translate'}</span>
      </button>
      {open ? (
        <div className="force-translate__panel">
          <label className="force-translate__label" htmlFor={selectId}>
            To
          </label>
          <select
            className="force-translate__select"
            disabled={loading}
            id={selectId}
            onChange={(event) => setTarget(event.target.value)}
            value={target}
          >
            <option value={ALL_VALUE}>All languages</option>
            {(meta?.targets ?? []).map((item) => (
              <option key={item.code} value={item.code}>
                {item.label} ({item.code})
              </option>
            ))}
          </select>
          <div className="force-translate__actions">
            <button
              className="force-translate__cancel"
              disabled={loading}
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="force-translate__go"
              disabled={loading}
              onClick={() => void handleTranslate()}
              type="button"
            >
              Translate
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
