'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { useTranslation } from '@/utilities/translateClient'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

type Props = Extract<Page['layout'][0], { blockType: 'advisorsBlock' }>
type AdvisorDescriptionData = NonNullable<NonNullable<Props['advisors']>[number]['description']>

const descriptionClassName =
  'max-w-none font-body-md text-[13px] font-light leading-[1.55] text-on-primary/75 md:text-[14px] [&_a]:text-secondary [&_a]:underline-offset-2 hover:[&_a]:text-on-secondary [&_h1]:mb-1 [&_h1]:font-headline-sm [&_h1]:text-[1.05rem] [&_h1]:font-light [&_h1]:leading-snug [&_h1]:text-on-primary [&_h2]:mb-1 [&_h2]:font-headline-sm [&_h2]:text-[1rem] [&_h2]:font-light [&_h2]:leading-snug [&_h2]:text-on-primary [&_h3]:mb-1 [&_h3]:font-headline-sm [&_h3]:text-[0.95rem] [&_h3]:font-light [&_h3]:leading-snug [&_h3]:text-on-primary [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-on-primary [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4'

function AdvisorDescription({ data }: { data: AdvisorDescriptionData }) {
  const readMoreLabel = useTranslation('blog.readMore', 'Read More')
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el || expanded) return

    const measureOverflow = () => {
      setOverflows(el.scrollHeight > el.clientHeight + 1)
    }

    measureOverflow()
    const observer = new ResizeObserver(measureOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [data, expanded])

  return (
    <div className="flex flex-col">
      <div className="relative">
        <div
          ref={contentRef}
          className={expanded ? undefined : 'h-[4.75rem] overflow-hidden'}
        >
          <RichText
            data={data}
            enableGutter={false}
            enableProse={false}
            className={descriptionClassName}
          />
        </div>
        {overflows && !expanded ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-primary to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-2 h-4">
        {overflows && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="cursor-pointer font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors hover:text-on-secondary"
          >
            {readMoreLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export const AdvisorsBlock: React.FC<Props> = ({ subtitle, title, advisors }) => {
  const sectionRef = useReveal()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const total = advisors?.length ?? 0

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const first = el.querySelector('article')
    if (!first) return
    const styles = getComputedStyle(el)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '24') || 24
    const cardWidth = first.getBoundingClientRect().width
    const perView = Math.max(1, Math.floor((el.clientWidth + gap) / (cardWidth + gap)))
    const pages = Math.max(1, total - perView + 1)
    setPageCount(pages)
    const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth)
    setPageIndex(Math.min(pages - 1, Math.round((el.scrollLeft / maxScroll) * (pages - 1))))
  }, [total])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    measure()
    const raf = window.requestAnimationFrame(measure)
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(raf)
      el.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const scrollToPage = (index: number) => {
    const el = scrollerRef.current
    const first = el?.querySelector('article')
    if (!el || !first) return
    const styles = getComputedStyle(el)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '24') || 24
    const cardWidth = first.getBoundingClientRect().width
    const next = Math.max(0, Math.min(pageCount - 1, index))
    el.scrollTo({ left: next * (cardWidth + gap), behavior: 'smooth' })
  }

  const showControls = total > 1

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-primary py-16 md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto mb-10 flex max-w-max-width flex-col gap-6 px-margin-mobile md:mb-14 md:flex-row md:items-end md:justify-between md:px-margin-desktop">
        <div className="reveal max-w-2xl">
          {subtitle ? (
            <span className="mb-4 block font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
              {subtitle}
            </span>
          ) : null}
          {title ? (
            <h2 className="m-0 font-headline-lg text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.15] tracking-[0.01em] text-on-primary">
              {title}
            </h2>
          ) : null}
        </div>

        {showControls ? (
          <div className="reveal flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => scrollToPage(pageIndex - 1)}
              aria-label="Previous advisors"
              disabled={pageIndex <= 0}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-secondary/50 text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary disabled:cursor-default disabled:opacity-35"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollToPage(pageIndex + 1)}
              aria-label="Next advisors"
              disabled={pageIndex >= pageCount - 1}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-secondary/50 text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary disabled:cursor-default disabled:opacity-35"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="reveal mx-auto flex max-w-max-width snap-x snap-mandatory gap-5 overflow-x-auto px-margin-mobile pb-1 md:gap-6 md:px-margin-desktop [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {advisors?.map((advisor, idx) => (
          <article
            key={idx}
            className="group w-[min(100%,17.5rem)] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-4.5rem)/3)] xl:w-[calc((100%-6rem)/4)]"
          >
            <div className="relative mb-5 aspect-[3/4] overflow-hidden rounded-2xl bg-surface-sand">
              {typeof advisor.image === 'object' && advisor.image !== null ? (
                <Media
                  resource={advisor.image}
                  fill
                  imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              ) : null}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary/50 to-transparent opacity-80"
                aria-hidden
              />
              <span className="absolute bottom-3 left-3 font-label-nav text-[10px] uppercase tracking-[0.2em] text-secondary">
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>

            <h3 className="m-0 mb-1 line-clamp-2 min-h-[2.6rem] font-headline-sm text-[1.2rem] font-light leading-snug tracking-[0.01em] text-on-primary">
              {advisor.name}
            </h3>
            <p className="m-0 mb-3 min-h-[1rem] font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary">
              {advisor.role || '\u00a0'}
            </p>
            {advisor.description ? <AdvisorDescription data={advisor.description} /> : null}
          </article>
        ))}
      </div>
    </section>
  )
}
