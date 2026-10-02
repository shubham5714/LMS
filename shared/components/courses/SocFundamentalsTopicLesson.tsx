"use client"

import { CourseTopicDocument } from "@/shared/components/courses/CourseTopicDocument"
import { PremiumSectionOverlay } from "@/shared/components/courses/PremiumSectionOverlay"
import {
  hasPaidMembership,
  SOC_FUNDAMENTALS_COURSE_ID,
  SOC_FUNDAMENTALS_TOPICS,
} from "@/shared/courses/soc-fundamentals-config"
import { courseProgressEventName } from "@/shared/courses/course-structure"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import Seo from "@/shared/layouts-components/seo/seo"
import React, { Fragment, useMemo } from "react"

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

  if (!topic) {
    return null
  }

  const topicLocked = Boolean(topic.paidOnly && !paid)

  return (
    <Fragment>
      <CourseTopicDocument
        courseId={SOC_FUNDAMENTALS_COURSE_ID}
        topicId={topicId}
        topicTitle={topic.title}
        topicLocked={topicLocked}
        progressEventName={courseProgressEventName(SOC_FUNDAMENTALS_COURSE_ID)}
        seoSlot={<Seo title={`${topic.title} · SOC Fundamentals`} />}
        topicLockedSlot={
          <PremiumSectionOverlay locked variant="topic">
            {null}
          </PremiumSectionOverlay>
        }
      />
    </Fragment>
  )
}
