'use client'

import React from 'react'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import RichText from '@/components/RichText'
import type { Post } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'

type Props = {
  content: Post['content']
}

export const PostBody: React.FC<Props> = ({ content }) => {
  const ref = useReveal()

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
      </div>

      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="-right-[20%] top-[12%] h-[58%] w-[48%] max-md:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="-left-24 bottom-[8%] h-64 w-64 opacity-70 md:h-80 md:w-80"
      />

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="reveal relative lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Editorial rail — Template Two accent, not Template One centered column */}
          <aside className="mb-8 hidden lg:col-span-1 lg:mb-0 lg:block" aria-hidden>
            <div className="sticky top-32 flex flex-col items-center gap-4 pt-2">
              <span className="h-10 w-px bg-secondary/50" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-24 w-px bg-gradient-to-b from-secondary/45 to-transparent" />
            </div>
          </aside>

          <div className="lg:col-span-10 xl:col-span-9">
            <div className="mb-10 flex items-center gap-4 lg:hidden">
              <span className="h-px flex-1 bg-gradient-to-r from-secondary/50 to-transparent" aria-hidden />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" aria-hidden />
            </div>

            <div className="relative rounded-[1.5rem] bg-surface-cream/70 px-5 py-8 sm:px-8 sm:py-10 md:rounded-[2rem] md:px-10 md:py-12 lg:px-12 lg:py-14">
              <RichText
                className="post-body-prose w-full max-w-none prose-headings:mt-10 prose-headings:mb-4 prose-headings:font-headline-md prose-headings:font-light prose-headings:tracking-[0.01em] prose-headings:text-primary prose-h2:text-[clamp(1.45rem,2.4vw,1.85rem)] prose-h3:text-[clamp(1.2rem,2vw,1.45rem)] prose-p:my-5 prose-p:font-body-lg prose-p:text-[16px] prose-p:font-light prose-p:leading-[1.9] prose-p:text-on-surface/75 md:prose-p:text-[17px] prose-li:my-1 prose-li:font-light prose-li:text-on-surface/75 prose-strong:font-medium prose-strong:text-primary prose-a:font-normal prose-a:text-secondary prose-a:no-underline hover:prose-a:underline prose-blockquote:my-10 prose-blockquote:border-l-0 prose-blockquote:border-none prose-blockquote:px-0 prose-blockquote:font-headline-md prose-blockquote:text-[clamp(1.25rem,2.4vw,1.65rem)] prose-blockquote:font-light prose-blockquote:italic prose-blockquote:leading-[1.45] prose-blockquote:text-primary prose-img:my-8 prose-img:rounded-2xl"
                data={content}
                enableGutter={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
