'use client'

import React, { useEffect, useRef, useState } from 'react'

import { toGoogleHl } from '@/utilities/googleLocale'

type Props = {
  siteKey: string
  locale: string
  onTokenChange: (token: string) => void
  onReadyChange?: (ready: boolean) => void
  onError?: (message: string | null) => void
}

/** Google reCAPTCHA v2 checkbox fixed size. */
const RECAPTCHA_WIDTH = 304
const RECAPTCHA_HEIGHT = 78

declare global {
  interface Window {
    grecaptcha?: {
      render?: (container: HTMLElement, options: Record<string, unknown>) => number
      reset?: (widgetId?: number) => void
      ready?: (callback: () => void) => void
      enterprise?: {
        render?: (container: HTMLElement, options: Record<string, unknown>) => number
        reset?: (widgetId?: number) => void
        ready?: (callback: () => void) => void
      }
    }
  }
}

function getRenderFn():
  | ((container: HTMLElement, options: Record<string, unknown>) => number)
  | undefined {
  if (typeof window.grecaptcha?.render === 'function') return window.grecaptcha.render
  if (typeof window.grecaptcha?.enterprise?.render === 'function') {
    return window.grecaptcha.enterprise.render
  }
  return undefined
}

function runWhenGrecaptchaReady(callback: () => void) {
  const readyFn = window.grecaptcha?.ready ?? window.grecaptcha?.enterprise?.ready
  if (readyFn) {
    readyFn(callback)
    return
  }
  callback()
}

function loadRecaptchaScript(googleHl: string): Promise<void> {
  const scriptId = `recaptcha-api-${googleHl}`
  const scriptSrc = `https://www.google.com/recaptcha/api.js?render=explicit&hl=${encodeURIComponent(googleHl)}`

  const existing = document.getElementById(scriptId) as HTMLScriptElement | null
  if (existing) {
    if (window.grecaptcha) return Promise.resolve()
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('reCAPTCHA script failed to load')),
        {
          once: true,
        },
      )
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.defer = true
    script.src = scriptSrc
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('reCAPTCHA script failed to load'))
    document.body.appendChild(script)
  })
}

export const RecaptchaWidget: React.FC<Props> = ({
  siteKey,
  locale,
  onTokenChange,
  onReadyChange,
  onError,
}) => {
  const googleHl = toGoogleHl(locale)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)
  const onTokenChangeRef = useRef(onTokenChange)
  const onReadyChangeRef = useRef(onReadyChange)
  const onErrorRef = useRef(onError)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange
  }, [onTokenChange])

  useEffect(() => {
    onReadyChangeRef.current = onReadyChange
  }, [onReadyChange])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || typeof ResizeObserver === 'undefined') return

    const updateScale = () => {
      const width = wrapper.clientWidth
      if (width <= 0) return
      setScale(Math.min(1, width / RECAPTCHA_WIDTH))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    onTokenChangeRef.current('')
    onReadyChangeRef.current?.(false)

    let cancelled = false

    // reCAPTCHA caches language in the global `grecaptcha` instance.
    // To ensure the checkbox text switches language, fully clear previous state.
    const clearAllRecaptchaState = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any
        if (w.grecaptcha) delete w.grecaptcha
      } catch {
        // ignore
      }

      document
        .querySelectorAll('script[id^="recaptcha-api-"]')
        .forEach((el) => el.parentElement?.removeChild(el))
    }

    clearAllRecaptchaState()

    const renderWidget = () => {
      if (cancelled || !containerRef.current) return

      const renderFn = getRenderFn()
      if (!renderFn) {
        onErrorRef.current?.(
          'reCAPTCHA key or script is incompatible with checkbox mode. Please use a v2 checkbox site key.',
        )
        return
      }

      containerRef.current.innerHTML = ''
      widgetIdRef.current = null

      try {
        widgetIdRef.current = renderFn(containerRef.current, {
          sitekey: siteKey,
          hl: googleHl,
          callback: (token: string) => onTokenChangeRef.current(token),
          'expired-callback': () => onTokenChangeRef.current(''),
          'error-callback': () => onTokenChangeRef.current(''),
        })
        onReadyChangeRef.current?.(true)
        onErrorRef.current?.(null)
      } catch (error) {
        console.error('Failed to render reCAPTCHA widget', error)
        widgetIdRef.current = null
        onErrorRef.current?.(
          'reCAPTCHA could not be loaded. Please refresh the page and try again.',
        )
      }
    }

    const init = async () => {
      try {
        await loadRecaptchaScript(googleHl)
        if (cancelled) return
        runWhenGrecaptchaReady(renderWidget)
      } catch (error) {
        console.error('Failed to load reCAPTCHA script', error)
        onErrorRef.current?.(
          'reCAPTCHA could not be loaded. Please refresh the page and try again.',
        )
      }
    }

    void init()

    return () => {
      cancelled = true
      widgetIdRef.current = null
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      onReadyChangeRef.current?.(false)
      clearAllRecaptchaState()
    }
  }, [siteKey, googleHl])

  return (
    <div
      ref={wrapperRef}
      className="w-full max-w-full overflow-hidden"
      style={{ height: RECAPTCHA_HEIGHT * scale }}
    >
      <div
        ref={containerRef}
        className="origin-top-left"
        style={{
          width: RECAPTCHA_WIDTH,
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      />
    </div>
  )
}
