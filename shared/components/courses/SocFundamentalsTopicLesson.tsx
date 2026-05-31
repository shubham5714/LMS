"use client"

import Seo from "@/shared/layouts-components/seo/seo"
import {
  getTopicOutline,
  hasPaidMembership,
  SOC_COURSE_PROGRESS_UPDATED_EVENT,
  SOC_FUNDAMENTALS_COURSE_ID,
  SOC_FUNDAMENTALS_TOPICS,
} from "@/shared/courses/soc-fundamentals-config"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import { PremiumSectionOverlay } from "./PremiumSectionOverlay"
import { useActiveOutlineSection } from "@/shared/hooks/useActiveOutlineSection"
import { useReadingProgress } from "@/shared/hooks/useReadingProgress"
import { useTopicScrollCompletion } from "@/shared/hooks/useTopicScrollCompletion"
import React, { Fragment, useCallback, useMemo } from "react"
import { TopicOnPageNav } from "./TopicOnPageNav"

type Props = {
  topicId: string
}

export function SocFundamentalsTopicLesson({ topicId }: Props) {
  const { membership } = useMembershipContext()
  const paid = hasPaidMembership(membership)

  const topic = useMemo(
    () => SOC_FUNDAMENTALS_TOPICS.find((t) => t.id === topicId),
    [topicId]
  )

  const sections = useMemo(() => getTopicOutline(topicId), [topicId])
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])

  const readingPercent = useReadingProgress()
  const activeSectionId = useActiveOutlineSection(sectionIds, 110)

  const notifyProgress = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(SOC_COURSE_PROGRESS_UPDATED_EVENT, {
        detail: { topicId },
      })
    )
  }, [topicId])

  useTopicScrollCompletion({
    courseId: SOC_FUNDAMENTALS_COURSE_ID,
    topicId,
    onPersisted: notifyProgress,
  })

  if (!topic) {
    return null
  }

  return (
    <Fragment>
      <Seo title={`${topic.title} · SOC Fundamentals`} />
      <div className="soc-fundamentals-topic py-4">
        <div className="soc-fundamentals-topic-layout">
          <div className="soc-fundamentals-topic-main">
            <h1 className="mb-2">{topic.title}</h1>
            <p className="text-muted mb-4">
              Scroll through each section. Reading progress and the current section update as you move. Mark
              the topic complete by reaching the bottom of the page.
            </p>

            {sections.length === 0 ? (
              <div className="card custom-card" style={{ minHeight: "120vh" }}>
                <div className="card-body">
                  <p className="mb-0">
                    Placeholder lesson content for <strong>{topic.title}</strong>. Add sections in{" "}
                    <code>SOC_FUNDAMENTALS_OUTLINE</code>.
                  </p>
                </div>
              </div>
            ) : (
              sections.map((s) => {
                const sectionLocked = Boolean(s.paidOnly && !paid)
                return (
                  <section
                    key={s.id}
                    id={s.id}
                    className="mb-5 pb-2"
                    style={{ scrollMarginTop: "6.5rem" }}
                  >
                    {s.level === 0 ? (
                      <h2 className="h4 mb-3">{s.title}</h2>
                    ) : (
                      <h3 className="h6 text-secondary mb-3">{s.title}</h3>
                    )}
                    <PremiumSectionOverlay
                      locked={sectionLocked}
                      previewSrc={s.premiumPreviewSrc}
                      overlayTintOnly={Boolean(s.premiumPreviewSrc)}
                    >
                      {s.premiumPreviewSrc ? (
                        <>
                          <img
                            src={s.premiumPreviewSrc}
                            alt={s.title}
                            className="img-fluid w-100 d-block rounded-3"
                            decoding="async"
                          />
                          <div className="card custom-card mt-3 mb-0">
                            <div className="card-body">
                              <p className="mb-3">
                                Placeholder content for <strong>{s.title}</strong>. Replace with your lesson
                                material.
                              </p>
                              <p className="text-muted small mb-0">
                                Additional copy for this section. Premium members see the full diagram and notes.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="card custom-card mb-0">
                          <div className="card-body">
                            <p className="mb-3">
                              Placeholder content for <strong>{s.title}</strong>. Replace with your lesson material.
                            </p>
                            <p className="text-muted small mb-0">
                              Additional copy to make sections scrollable. Detection highlights this block when its
                              heading crosses the top of the viewport.
                            </p>
                          </div>
                        </div>
                      )}
                    </PremiumSectionOverlay>
                    {!s.premiumPreviewSrc ? (
                      <div style={{ minHeight: "28vh" }} aria-hidden className="d-none d-md-block" />
                    ) : null}
                  </section>
                )
              })
            )}
            <p className="mt-4 text-muted small">— End of topic —</p>
          </div>

          {sections.length > 0 ? (
            <aside className="soc-fundamentals-topic-toc" aria-label="On this page">
              <div className="soc-fundamentals-topic-toc-inner">
                <TopicOnPageNav
                  sections={sections}
                  activeSectionId={activeSectionId}
                  readingPercent={readingPercent}
                  hasPaidAccess={paid}
                />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </Fragment>
  )
}
