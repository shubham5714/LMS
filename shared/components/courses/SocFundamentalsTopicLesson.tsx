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
import { CourseLessonImage } from "./CourseLessonImage"
import { PremiumSectionOverlay } from "./PremiumSectionOverlay"
import { useLessonImageSlides } from "./useLessonImageSlides"
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

  const topicLocked = Boolean(topic?.paidOnly && !paid)
  const sections = useMemo(() => getTopicOutline(topicId), [topicId])
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])
  const accessibleSections = useMemo(
    () => (topicLocked ? [] : sections.filter((s) => !s.paidOnly || paid)),
    [sections, paid, topicLocked]
  )
  const imageSlides = useLessonImageSlides(accessibleSections)

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
      <div className="soc-fundamentals-topic">
        <div className="soc-fundamentals-topic-layout">
          <div className="soc-fundamentals-topic-main">
            <h1 className="course-topic-lesson__title">{topic.title}</h1>
            <p className="course-topic-lesson__lead text-muted">
              Scroll through each section. Reading progress and the current section update as you move. Mark
              the topic complete by reaching the bottom of the page.
            </p>

            {topicLocked ? (
              <PremiumSectionOverlay locked variant="topic">
                {null}
              </PremiumSectionOverlay>
            ) : sections.length === 0 ? (
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
                    className={`course-topic-section ${s.level === 1 ? "course-topic-section--nested" : ""}`}
                    style={{ scrollMarginTop: "6.5rem" }}
                  >
                    {s.level === 0 ? (
                      <h2 className="course-topic-section__heading">{s.title}</h2>
                    ) : (
                      <h3 className="course-topic-section__heading">{s.title}</h3>
                    )}
                    <PremiumSectionOverlay locked={sectionLocked}>
                      {s.premiumPreviewSrc ? (
                        <>
                          <CourseLessonImage
                            src={s.premiumPreviewSrc}
                            alt={s.title}
                            className="img-fluid w-100 d-block rounded-3"
                            slides={imageSlides}
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
                    {!s.premiumPreviewSrc && !sectionLocked ? (
                      <div style={{ minHeight: "28vh" }} aria-hidden className="d-none d-md-block" />
                    ) : null}
                  </section>
                )
              })
            )}
            {!topicLocked ? (
              <p className="mt-4 text-muted small">— End of topic —</p>
            ) : null}
          </div>

          {!topicLocked && sections.length > 0 ? (
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
