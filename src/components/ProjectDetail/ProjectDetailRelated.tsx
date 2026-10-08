'use client'

import React from 'react'

import { ProjectsCarousel } from '@/components/ProjectsCarousel'
import type { NormalizedCRMProject } from '@/utilities/crmProjects'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  projects: NormalizedCRMProject[]
  loading?: boolean
}

export const ProjectDetailRelated: React.FC<Props> = ({ projects, loading = false }) => {
  const subtitle = useTranslation('projectDetail.similar.subtitle', 'Curated Collection')
  const title = useTranslation('projectDetail.similar.heading', 'Similar Projects')
  const emptyEyebrow = useTranslation('projectsCarousel.empty.eyebrow', 'Projects')
  const emptyTitle = useTranslation('projectsCarousel.empty.title', 'No projects found')
  const emptyDescription = useTranslation(
    'projectDetail.similar.emptyDescription',
    'We could not find similar projects right now. Check again soon.',
  )

  if (!loading && projects.length === 0) return null

  return (
    <ProjectsCarousel
      subtitle={subtitle}
      title={title}
      projects={projects}
      loading={loading}
      backgroundColor="surface"
      animateEntry
      emptyEyebrow={emptyEyebrow}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  )
}
