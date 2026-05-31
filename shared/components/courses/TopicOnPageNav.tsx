"use client"

import React from "react"
import { ProgressBar } from "react-bootstrap"

export type CourseOutlineSection = {
  id: string
  title: string
  level: 0 | 1
  paidOnly?: boolean
  premiumPreviewSrc?: string
}

type Props = {
  sections: readonly CourseOutlineSection[]
  activeSectionId: string
  readingPercent: number
  hasPaidAccess?: boolean
}

export function TopicOnPageNav({
  sections,
  activeSectionId,
  readingPercent,
  hasPaidAccess = true,
}: Props) {
  if (sections.length === 0) return null

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="topic-on-page-nav h-100">
      <h2 id="topic-on-page-nav-heading" className="h6 fw-semibold mb-3 topic-on-page-nav__title">
        On this page
      </h2>

      <section className="topic-on-page-nav__reading mb-4" aria-label="Reading progress">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2 fw-semibold small">
            <i className="ri-book-open-line text-primary" aria-hidden />
            <span>Reading progress</span>
          </div>
          <span className="small text-muted">{readingPercent}%</span>
        </div>
        <ProgressBar now={readingPercent} style={{ height: 6 }} variant="primary" />
      </section>

      <div className="position-relative topic-on-page-nav__outline">
        <div
          className="position-absolute top-0 bottom-0 end-0 border-end opacity-50"
          style={{ width: 1 }}
          aria-hidden
        />
        <nav className="pe-3" aria-labelledby="topic-on-page-nav-heading">
          <ul className="list-unstyled small mb-0">
            {sections.map((s) => {
              const active = activeSectionId === s.id
              const indent = s.level > 0 ? "ps-3" : ""
              const lockedNav = Boolean(s.paidOnly && !hasPaidAccess)
              return (
                <li key={s.id} className={`mb-2 ${indent}`}>
                  <button
                    type="button"
                    className={`btn btn-link text-start p-0 text-decoration-none lh-sm w-100 d-inline-flex align-items-start gap-1 ${
                      active ? "text-primary fw-semibold" : "text-muted"
                    }`}
                    onClick={() => scrollTo(s.id)}
                  >
                    <span className="flex-grow-1">{s.title}</span>
                    {lockedNav ? (
                      <i className="ri-lock-2-fill flex-shrink-0 mt-1 small opacity-75" title="Premium" aria-hidden />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
