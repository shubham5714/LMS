"use client"

import Seo from "@/shared/layouts-components/seo/seo"
import {
  getSectionComparison,
  getSectionContent,
  getSectionTable,
  getInstallationSteps,
  getTopicNavSections,
  getTopicOutline,
  hasPaidMembership,
  resolveNavActiveSectionId,
  type SecuronixSectionComparison,
  SECURONIX_COURSE_PROGRESS_UPDATED_EVENT,
  SECURONIX_SIEM_COURSE_ID,
  SECURONIX_SIEM_DISPLAY_NAME,
  SECURONIX_SIEM_TOPICS,
} from "@/shared/courses/securonix-siem-config"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import { CourseLessonImage } from "./CourseLessonImage"
import { InstallationSteps } from "./InstallationSteps"
import { PremiumSectionOverlay } from "./PremiumSectionOverlay"
import { SectionBody } from "./SectionBody"
import { SectionTable } from "./SectionTable"
import { StorylaneEmbed } from "./StorylaneEmbed"
import { useLessonImageSlides } from "./useLessonImageSlides"
import { useActiveOutlineSection } from "@/shared/hooks/useActiveOutlineSection"
import { useReadingProgress } from "@/shared/hooks/useReadingProgress"
import { useTopicScrollCompletion } from "@/shared/hooks/useTopicScrollCompletion"
import React, { Fragment, useCallback, useMemo } from "react"
import { TopicOnPageNav } from "./TopicOnPageNav"

type Props = {
  topicId: string
}

function SectionComparison({ comparison }: { comparison: SecuronixSectionComparison }) {
  return (
    <div className="course-topic-comparison">
      <p className="course-topic-section__body mb-2">
        <strong>Traditional SIEM:</strong> {comparison.traditional}
      </p>
      <p className="course-topic-section__body mb-0">
        <strong>Securonix:</strong> {comparison.securonix}
      </p>
    </div>
  )
}

export function SecuronixSiemTopicLesson({ topicId }: Props) {
  const { membership } = useMembershipContext()
  const paid = hasPaidMembership(membership)

  const topic = useMemo(
    () => SECURONIX_SIEM_TOPICS.find((t) => t.id === topicId),
    [topicId]
  )

  const topicLocked = Boolean(topic?.paidOnly && !paid)
  const sections = useMemo(() => getTopicOutline(topicId), [topicId])
  const navSections = useMemo(() => getTopicNavSections(topicId), [topicId])
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])
  const accessibleSections = useMemo(
    () => (topicLocked ? [] : sections.filter((s) => !s.paidOnly || paid)),
    [sections, paid, topicLocked]
  )
  const imageSlides = useLessonImageSlides(accessibleSections)

  const readingPercent = useReadingProgress()
  const activeScrollSectionId = useActiveOutlineSection(sectionIds, 110)
  const activeNavSectionId = useMemo(
    () => resolveNavActiveSectionId(activeScrollSectionId, sections),
    [activeScrollSectionId, sections]
  )

  const notifyProgress = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(SECURONIX_COURSE_PROGRESS_UPDATED_EVENT, {
        detail: { topicId },
      })
    )
  }, [topicId])

  useTopicScrollCompletion({
    courseId: SECURONIX_SIEM_COURSE_ID,
    topicId,
    onPersisted: notifyProgress,
  })

  if (!topic) {
    return null
  }

  return (
    <Fragment>
      <Seo title={`${topic.title} · ${SECURONIX_SIEM_DISPLAY_NAME}`} />
      <div className="soc-fundamentals-topic course-topic-lesson">
        <div className="soc-fundamentals-topic-layout">
          <div className="soc-fundamentals-topic-main">
            <h1 className="course-topic-lesson__title">{topic.title}</h1>

            {topicLocked ? (
              <PremiumSectionOverlay locked variant="topic">
                {null}
              </PremiumSectionOverlay>
            ) : sections.length === 0 ? (
              <div className="card custom-card" style={{ minHeight: "120vh" }}>
                <div className="card-body">
                  <p className="mb-0">
                    Placeholder lesson content for <strong>{topic.title}</strong>. Add sections in{" "}
                    <code>SECURONIX_SIEM_OUTLINE</code>.
                  </p>
                </div>
              </div>
            ) : (
              sections.map((s) => {
                const sectionLocked = Boolean(s.paidOnly && !paid)
                const sectionContent = getSectionContent(topicId, s.id)
                const sectionComparison = getSectionComparison(topicId, s.id)
                const sectionTable = getSectionTable(topicId, s.id)
                const installationSteps = getInstallationSteps(topicId, s.id)
                const showSectionBody = !s.headingOnly
                return (
                  <section
                    key={s.id}
                    id={s.id}
                    className={`course-topic-section ${s.level === 1 ? "course-topic-section--nested" : ""}`}
                    style={{ scrollMarginTop: "6.5rem" }}
                  >
                    {!s.suppressHeading ? (
                      s.level === 0 ? (
                        <h2 className="course-topic-section__heading">{s.title}</h2>
                      ) : (
                        <h3 className="course-topic-section__heading">{s.title}</h3>
                      )
                    ) : null}
                    {showSectionBody ? (
                      <PremiumSectionOverlay locked={sectionLocked}>
                        {s.premiumPreviewSrc ? (
                          <>
                            <CourseLessonImage
                              src={s.premiumPreviewSrc}
                              alt={s.title}
                              className="img-fluid w-100 d-block rounded-3"
                              slides={imageSlides}
                            />
                            <p className="course-topic-section__subtext mb-0 mt-2">
                              Placeholder content for <strong>{s.title}</strong>. Replace with your lesson material.
                            </p>
                          </>
                        ) : sectionContent && s.imageSrc ? (
                          <>
                            <SectionBody content={sectionContent} />
                            <CourseLessonImage
                              src={s.imageSrc}
                              alt={s.imageAlt ?? s.title}
                              className="img-fluid w-100 d-block rounded-3 course-topic-section__figure mt-3"
                              slides={imageSlides}
                            />
                          </>
                        ) : s.imageSrc ? (
                          <CourseLessonImage
                            src={s.imageSrc}
                            alt={s.imageAlt ?? s.title}
                            className="img-fluid w-100 d-block rounded-3 course-topic-section__figure"
                            slides={imageSlides}
                          />
                        ) : sectionContent && s.storylaneEmbedSrc ? (
                          <>
                            <SectionBody content={sectionContent} />
                            <StorylaneEmbed
                              src={s.storylaneEmbedSrc}
                              title={`${topic.title} — interactive demo`}
                            />
                          </>
                        ) : installationSteps ? (
                          <InstallationSteps steps={installationSteps} />
                        ) : sectionComparison ? (
                          <SectionComparison comparison={sectionComparison} />
                        ) : sectionContent && sectionTable ? (
                          <>
                            <SectionBody content={sectionContent} />
                            <SectionTable table={sectionTable} />
                          </>
                        ) : sectionTable ? (
                          <SectionTable table={sectionTable} />
                        ) : sectionContent ? (
                          <SectionBody content={sectionContent} />
                        ) : (
                          <p className="course-topic-section__subtext mb-0">
                            Placeholder content for <strong>{s.title}</strong>. Replace with your lesson material.
                          </p>
                        )}
                      </PremiumSectionOverlay>
                    ) : null}
                  </section>
                )
              })
            )}
          </div>

          {!topicLocked && sections.length > 0 ? (
            <aside className="soc-fundamentals-topic-toc" aria-label="On this page">
              <div className="soc-fundamentals-topic-toc-inner">
                <TopicOnPageNav
                  sections={navSections}
                  activeSectionId={activeNavSectionId}
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
