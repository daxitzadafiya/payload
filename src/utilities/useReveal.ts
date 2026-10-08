'use client'

import { useEffect, useRef } from 'react'

const collectRevealElements = (root: ParentNode): Element[] => {
  const elements: Element[] = []
  if (root instanceof Element && root.classList.contains('reveal')) {
    elements.push(root)
  }
  root.querySelectorAll('.reveal').forEach((el) => {
    if (!elements.includes(el)) elements.push(el)
  })
  return elements
}

export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const tracked = new WeakSet<Element>()

    const isVisible = (el: Element) => {
      const rect = el.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      return rect.top < viewportHeight * 0.95 && rect.bottom > 0
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
          intersectionObserver.unobserve(entry.target)
          tracked.delete(entry.target)
        }
      },
      {
        threshold: 0.01,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    const activateReveal = (el: Element) => {
      if (!el.classList.contains('reveal') || el.classList.contains('active')) return

      if (isVisible(el)) {
        el.classList.add('active')
        return
      }

      if (!tracked.has(el)) {
        tracked.add(el)
        intersectionObserver.observe(el)
      }
    }

    const scanReveals = (root: ParentNode = element) => {
      collectRevealElements(root).forEach(activateReveal)
    }

    scanReveals()

    const rafId = window.requestAnimationFrame(() => scanReveals())

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            scanReveals(node)
          }
        })
      }
    })

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    })

    const failsafeId = window.setTimeout(() => {
      element.querySelectorAll('.reveal:not(.active)').forEach((el) => {
        el.classList.add('active')
        intersectionObserver.unobserve(el)
      })
    }, 1200)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(failsafeId)
      mutationObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  return ref
}

/** Call after async content mounts so `.reveal` elements become visible immediately. */
export function activateRevealElements(root: ParentNode | null | undefined) {
  if (!root) return
  collectRevealElements(root).forEach((el) => {
    el.classList.add('active')
  })
}
