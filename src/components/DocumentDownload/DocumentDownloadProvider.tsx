'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { DocumentDownloadModal } from '@/components/DocumentDownload/DocumentDownloadModal'
import type { Form } from '@/payload-types'
import type { PropertyInquiryContext } from '@/utilities/propertyInquiry'
import {
  type DocumentDownloadRequest,
  type DocumentDownloadTarget,
} from '@/utilities/documentDownload'

type DocumentDownloadContextValue = {
  requestDownload: (target: DocumentDownloadTarget) => void
}

const DocumentDownloadContext = createContext<DocumentDownloadContextValue | null>(null)

export function useDocumentDownload(): DocumentDownloadContextValue {
  const context = useContext(DocumentDownloadContext)
  if (!context) {
    throw new Error('useDocumentDownload must be used within DocumentDownloadProvider')
  }
  return context
}

type Props = {
  children: React.ReactNode
  contactForm?: Form | null
  inquiry: PropertyInquiryContext
  heroImageUrl?: string
}

export const DocumentDownloadProvider: React.FC<Props> = ({
  children,
  contactForm,
  inquiry,
  heroImageUrl,
}) => {
  const [request, setRequest] = useState<DocumentDownloadRequest | null>(null)

  const requestDownload = useCallback((target: DocumentDownloadTarget) => {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
    setRequest({ ...target, pageUrl })
  }, [])

  const close = useCallback(() => {
    setRequest(null)
  }, [])

  const value = useMemo(() => ({ requestDownload }), [requestDownload])

  return (
    <DocumentDownloadContext.Provider value={value}>
      {children}
      <DocumentDownloadModal
        contactForm={contactForm}
        heroImageUrl={heroImageUrl}
        inquiry={inquiry}
        open={request != null}
        request={request}
        onClose={close}
      />
    </DocumentDownloadContext.Provider>
  )
}
