"use client"

import { CourseTopicDocument } from "@/shared/components/courses/CourseTopicDocument"
import { PremiumSectionOverlay } from "@/shared/components/courses/PremiumSectionOverlay"
import {
  hasPaidMembership,
  SECURONIX_SIEM_COURSE_ID,
  SECURONIX_SIEM_DISPLAY_NAME,
  SECURONIX_SIEM_TOPICS,
} from "@/shared/courses/securonix-siem-config"
import { courseProgressEventName } from "@/shared/courses/course-structure"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import Seo from "@/shared/layouts-components/seo/seo"
import React, { Fragment, useMemo } from "react"

type Props = {
  topicId: string
}

export function SecuronixSiemTopicLesson({ topicId }: Props) {
  const { membership } = useMembershipContext()
  const paid = hasPaidMembership(membership)

  const topic = useMemo(
    () => SECURONIX_SIEM_TOPICS.find((t) => t.id === topicId),
    [topicId]
  )

  if (!topic) {
    return null
  }

  const topicLocked = Boolean(topic.paidOnly && !paid)

  return (
    <Fragment>
      <CourseTopicDocument
        courseId={SECURONIX_SIEM_COURSE_ID}
        topicId={topicId}
        topicTitle={topic.title}
        topicLocked={topicLocked}
        progressEventName={courseProgressEventName(SECURONIX_SIEM_COURSE_ID)}
        seoSlot={<Seo title={`${topic.title} · ${SECURONIX_SIEM_DISPLAY_NAME}`} />}
        topicLockedSlot={
          <PremiumSectionOverlay locked variant="topic">
            {null}
          </PremiumSectionOverlay>
        }
      />
    </Fragment>
  )
}
