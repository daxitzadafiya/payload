import React from 'react'

import { aString } from '@/utilities/adminI18n'

import { DASHBOARD_HERO_I18N } from './i18n'

type AdminDashboardHeroProps = {
  i18n?: { language?: string } | null
}

/**
 * Visual welcome strip above the dashboard grid — no behaviour changes.
 * Copy uses admin.* i18n (account language), seeded via DeepL like other admin labels.
 */
export default function AdminDashboardHero(props: AdminDashboardHeroProps) {
  const lang = props.i18n?.language

  const eyebrow = aString(...DASHBOARD_HERO_I18N.eyebrow, lang)
  const title = aString(...DASHBOARD_HERO_I18N.title, lang)
  const text = aString(...DASHBOARD_HERO_I18N.text, lang)
  const chipListings = aString(...DASHBOARD_HERO_I18N.chipListings, lang)
  const chipPages = aString(...DASHBOARD_HERO_I18N.chipPages, lang)
  const chipGlobals = aString(...DASHBOARD_HERO_I18N.chipGlobals, lang)

  return (
    <section className="admin-dash-hero" aria-label={title}>
      <div className="admin-dash-hero__media" />
      <div className="admin-dash-hero__veil" />
      <div className="admin-dash-hero__copy">
        <p className="admin-dash-hero__eyebrow">{eyebrow}</p>
        <h1 className="admin-dash-hero__title">{title}</h1>
        <p className="admin-dash-hero__text">{text}</p>
      </div>
      <ul className="admin-dash-hero__chips">
        <li>{chipListings}</li>
        <li>{chipPages}</li>
        <li>{chipGlobals}</li>
      </ul>
    </section>
  )
}
