'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  readFavoriteIdsFromDocument,
  readProjectFavoriteIdsFromDocument,
  toggleFavoriteId,
  writeFavoriteIdsToDocument,
  writeProjectFavoriteIdsToDocument,
  type FavoriteProjectId,
  type FavoritePropertyId,
} from '@/utilities/propertyFavorites'

type PropertyFavoritesContextValue = {
  /** @deprecated Prefer `propertyFavoriteIds` — kept for existing property callers. */
  favoriteIds: FavoritePropertyId[]
  propertyFavoriteIds: FavoritePropertyId[]
  projectFavoriteIds: FavoriteProjectId[]
  propertyCount: number
  projectCount: number
  /** Combined badge count (properties + projects). */
  count: number
  isFavorite: (id: FavoritePropertyId | undefined | null) => boolean
  isProjectFavorite: (id: FavoriteProjectId | undefined | null) => boolean
  toggleFavorite: (id: FavoritePropertyId) => void
  toggleProjectFavorite: (id: FavoriteProjectId) => void
}

const PropertyFavoritesContext = createContext<PropertyFavoritesContextValue | null>(null)

export const PropertyFavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [propertyFavoriteIds, setPropertyFavoriteIds] = useState<FavoritePropertyId[]>([])
  const [projectFavoriteIds, setProjectFavoriteIds] = useState<FavoriteProjectId[]>([])

  useEffect(() => {
    setPropertyFavoriteIds(readFavoriteIdsFromDocument())
    setProjectFavoriteIds(readProjectFavoriteIdsFromDocument())
  }, [])

  const isFavorite = useCallback(
    (id: FavoritePropertyId | undefined | null) => {
      if (id === undefined || id === null || id === '') return false
      return propertyFavoriteIds.some((entry) => String(entry) === String(id))
    },
    [propertyFavoriteIds],
  )

  const isProjectFavorite = useCallback(
    (id: FavoriteProjectId | undefined | null) => {
      if (id === undefined || id === null || id === '') return false
      return projectFavoriteIds.some((entry) => String(entry) === String(id))
    },
    [projectFavoriteIds],
  )

  const toggleFavorite = useCallback((id: FavoritePropertyId) => {
    setPropertyFavoriteIds((prev) => {
      const next = toggleFavoriteId(prev, id)
      writeFavoriteIdsToDocument(next)
      return next
    })
  }, [])

  const toggleProjectFavorite = useCallback((id: FavoriteProjectId) => {
    setProjectFavoriteIds((prev) => {
      const next = toggleFavoriteId(prev, id)
      writeProjectFavoriteIdsToDocument(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      favoriteIds: propertyFavoriteIds,
      propertyFavoriteIds,
      projectFavoriteIds,
      propertyCount: propertyFavoriteIds.length,
      projectCount: projectFavoriteIds.length,
      count: propertyFavoriteIds.length + projectFavoriteIds.length,
      isFavorite,
      isProjectFavorite,
      toggleFavorite,
      toggleProjectFavorite,
    }),
    [
      propertyFavoriteIds,
      projectFavoriteIds,
      isFavorite,
      isProjectFavorite,
      toggleFavorite,
      toggleProjectFavorite,
    ],
  )

  return (
    <PropertyFavoritesContext.Provider value={value}>
      {children}
    </PropertyFavoritesContext.Provider>
  )
}

export function usePropertyFavorites(): PropertyFavoritesContextValue {
  const context = useContext(PropertyFavoritesContext)
  if (!context) {
    throw new Error('usePropertyFavorites must be used within PropertyFavoritesProvider')
  }
  return context
}

/** Project-only favorites helpers (same provider). */
export function useProjectFavorites(): {
  favoriteIds: FavoriteProjectId[]
  count: number
  isFavorite: (id: FavoriteProjectId | undefined | null) => boolean
  toggleFavorite: (id: FavoriteProjectId) => void
} {
  const {
    projectFavoriteIds,
    projectCount,
    isProjectFavorite,
    toggleProjectFavorite,
  } = usePropertyFavorites()

  return {
    favoriteIds: projectFavoriteIds,
    count: projectCount,
    isFavorite: isProjectFavorite,
    toggleFavorite: toggleProjectFavorite,
  }
}
