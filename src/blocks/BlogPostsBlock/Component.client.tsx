'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { PageRange } from '@/components/PageRange'
import { PropertyListPagination } from '@/components/PropertyList/PropertyListPagination'
import type { CMSLinkType } from '@/components/Link'
import { activateRevealElements, useReveal } from '@/utilities/useReveal'
import { useTranslation } from '@/utilities/translateClient'

import { DecorativeVectors } from '@/components/DecorativeVectors'

import { BlogEmptyState } from './BlogEmptyState'
import { BlogPostTeaser, type BlogPostTeaserData } from './BlogPostTeaser'

export type BlogPostItem = BlogPostTeaserData

type ClientProps = {
  subtitle?: string | null
  title: string
  postsPerPage: number
  initialPage: number
  initialPosts: BlogPostItem[]
  initialTotalPages: number
  initialTotalDocs: number
  emptyStateEyebrow?: string | null
  emptyStateTitle?: string | null
  emptyStateDescription?: string | null
  emptyStateLink?: CMSLinkType | null
}

export const BlogPostsBlockClient: React.FC<ClientProps> = ({
  subtitle,
  title,
  postsPerPage,
  initialPage,
  initialPosts,
  initialTotalPages,
  initialTotalDocs,
  emptyStateEyebrow,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateLink,
}) => {
  const sectionRef = useReveal()
  const readMoreLabel = useTranslation('blog.readMore', 'Read More')
  const resultsRef = useRef<HTMLDivElement>(null)
  const skipInitialFetch = useRef(true)
  const pendingPageScrollRef = useRef(false)

  const [page, setPage] = useState(initialPage)
  const [posts, setPosts] = useState(initialPosts)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [totalDocs, setTotalDocs] = useState(initialTotalDocs)
  const [loading, setLoading] = useState(false)

  const scrollToPageTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [])

  const fetchPosts = useCallback(
    async (nextPage: number) => {
      setLoading(true)

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(postsPerPage),
        })

        const response = await fetch(`/api/blog-posts?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch posts')

        const data = (await response.json()) as {
          posts: BlogPostItem[]
          totalPages: number
          totalDocs: number
        }

        setPosts(data.posts)
        setTotalPages(data.totalPages)
        setTotalDocs(data.totalDocs)
      } catch (error) {
        console.error('Failed to load blog posts:', error)
      } finally {
        setLoading(false)
      }
    },
    [postsPerPage],
  )

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false
      return
    }

    void fetchPosts(page)
  }, [page, fetchPosts])

  useEffect(() => {
    if (loading) return
    activateRevealElements(resultsRef.current)
  }, [loading, page, posts.length])

  useEffect(() => {
    if (loading || !pendingPageScrollRef.current) return
    pendingPageScrollRef.current = false
    scrollToPageTop()
  }, [loading, page, scrollToPageTop])

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return
    pendingPageScrollRef.current = true
    setPage(nextPage)
    scrollToPageTop()
  }

  const [featured, ...rest] = posts

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-surface-cream py-16 md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>

      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="-right-[14%] top-[6%] h-[48%] w-[40%] max-lg:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="-left-20 bottom-[12%] h-56 w-56 opacity-60 md:h-72 md:w-72"
      />

      <div className="reveal relative mx-auto mb-10 max-w-max-width px-margin-mobile md:mb-14 md:px-margin-desktop">
        <div className="max-w-2xl">
          {subtitle ? (
            <span className="mb-4 block font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
              {subtitle}
            </span>
          ) : null}
          <h2 className="m-0 font-headline-lg text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.15] tracking-[0.01em] text-primary">
            {title}
          </h2>
        </div>

        <div className="mt-6">
          <PageRange
            collection="posts"
            currentPage={page}
            limit={postsPerPage}
            totalDocs={totalDocs}
          />
        </div>
      </div>

      <div ref={resultsRef}>
        {posts.length > 0 ? (
          <div
            className={`mx-auto max-w-max-width px-margin-mobile transition-opacity duration-300 md:px-margin-desktop ${
              loading ? 'pointer-events-none opacity-50' : 'opacity-100'
            }`}
          >
            {featured ? (
              <div className="reveal mb-14 md:mb-16">
                <BlogPostTeaser {...featured} featured readMoreLabel={readMoreLabel} />
              </div>
            ) : null}

            {rest.length > 0 ? (
              <>
                <div className="mb-10 h-px w-full bg-gradient-to-r from-secondary/40 via-secondary/15 to-transparent" aria-hidden />
                <div className="reveal grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
                  {rest.map((post) => (
                    <BlogPostTeaser key={post.id} {...post} readMoreLabel={readMoreLabel} />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          !loading && (
            <div className="reveal mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
              <BlogEmptyState
                eyebrow={emptyStateEyebrow || undefined}
                title={emptyStateTitle || undefined}
                description={emptyStateDescription || undefined}
                ctaLink={emptyStateLink}
              />
            </div>
          )
        )}
      </div>

      <div
        className={`mx-auto max-w-max-width px-margin-mobile transition-opacity duration-300 md:px-margin-desktop ${
          loading ? 'pointer-events-none opacity-50' : 'opacity-100'
        }`}
      >
        <PropertyListPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </section>
  )
}
