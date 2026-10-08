'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'

type Props = Extract<Page['layout'][0], { blockType: 'statsBlock' }>

const DURATION_MS = 2200

type ParsedStat = {
  hasNumber: boolean
  prefix: string
  suffix: string
  end: number
  useCommas: boolean
  decimals: number
}

function parseStatValue(value: string): ParsedStat {
  const trimmed = value.trim()
  const useCommas = trimmed.includes(',')
  const normalized = trimmed.replace(/,/g, '')
  const match = normalized.match(/^([^\d]*)([\d.]+)(.*)$/)

  if (!match) {
    return {
      hasNumber: false,
      prefix: '',
      suffix: '',
      end: 0,
      useCommas: false,
      decimals: 0,
    }
  }

  const numericPart = match[2]
  const decimals = numericPart.includes('.') ? numericPart.split('.')[1].length : 0

  return {
    hasNumber: true,
    prefix: match[1],
    suffix: match[3],
    end: parseFloat(numericPart),
    useCommas,
    decimals,
  }
}

function formatCount(current: number, parsed: ParsedStat): string {
  const rounded =
    parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current))

  const [intPart, decPart] = rounded.split('.')
  const formattedInt = parsed.useCommas
    ? Number(intPart).toLocaleString('en-US')
    : intPart

  const numberStr = decPart ? `${formattedInt}.${decPart}` : formattedInt
  return `${parsed.prefix}${numberStr}${parsed.suffix}`
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const AnimatedStatValue: React.FC<{ value: string }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const parsed = useMemo(() => parseStatValue(value), [value])
  const [display, setDisplay] = useState(() =>
    parsed.hasNumber ? formatCount(0, parsed) : value,
  )
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!parsed.hasNumber) {
      setDisplay(value)
      return
    }

    const el = ref.current
    if (!el) return

    setDisplay(formatCount(0, parsed))
    hasAnimated.current = false

    const runAnimation = () => {
      if (hasAnimated.current) return
      hasAnimated.current = true

      const start = performance.now()

      const tick = (now: number) => {
        const progress = Math.min((now - start) / DURATION_MS, 1)
        const eased = easeOutCubic(progress)
        const current = parsed.end * eased
        setDisplay(formatCount(current, parsed))

        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          setDisplay(formatCount(parsed.end, parsed))
        }
      }

      requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation()
          observer.disconnect()
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [parsed, value])

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  )
}

export const StatsBlock: React.FC<Props> = ({ stats }) => {
  const ref = useReveal()
  const items = stats ?? []

  if (!items.length) return null

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-cream py-14 md:py-16 lg:py-20">
      <div className="reveal mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-2 border-y border-secondary/25 md:grid-cols-4 md:divide-x md:divide-secondary/25">
          {items.map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center px-4 py-8 text-center md:px-8 md:py-10 ${
                i < 2 ? 'border-b border-secondary/25 md:border-b-0' : ''
              }`}
            >
              <h3 className="m-0 mb-2 font-display-lg text-[clamp(2rem,4vw,3.15rem)] font-light leading-none text-secondary">
                <AnimatedStatValue value={stat.value} />
              </h3>
              <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-surface/70 sm:text-[12px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
