"use client"

import { CourseTopicDocument } from "@/shared/components/courses/CourseTopicDocument"
import { LessonLoadingDots } from "@/shared/components/courses/LessonLoadingDots"
import { PremiumSectionOverlay } from "@/shared/components/courses/PremiumSectionOverlay"
import {
  courseProgressEventName,
  type CourseTopicNavItem,
} from "@/shared/courses/course-structure"
import {
  fetchCourseById,
  fetchCourseTopic,
} from "@/shared/courses/course-structure-client"
import { hasPaidMembership } from "@/shared/courses/membership-roles"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import Seo from "@/shared/layouts-components/seo/seo"
import React, { Fragment, useEffect, useState } from "react"

type Props = {
  courseId: string
  topicId: string
}

export function DbCourseTopicLesson({ courseId, topicId }: Props) {
  const { membership } = useMembershipContext()
  const paid = hasPaidMembership(membership)
  const [courseTitle, setCourseTitle] = useState(courseId)
  const [topic, setTopic] = useState<CourseTopicNavItem | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">(
    "loading"
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadState("loading")
      const [course, topicRow] = await Promise.all([
        fetchCourseById(courseId),
        fetchCourseTopic(courseId, topicId),
      ])
      if (cancelled) return
      if (course) setCourseTitle(course.title)
      if (!topicRow) {
        setTopic(null)
        setLoadState("missing")
        return
      }
      setTopic(topicRow)
      setLoadState("ready")
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, topicId])

  if (loadState === "loading") {
    return <LessonLoadingDots />
  }

  if (loadState === "missing" || !topic) {
    return (
      <div className="course-topic-lesson">
        <h1 className="course-topic-lesson__title">Topic not found</h1>
        <p className="text-muted">
          No topic <code>{topicId}</code> in course <code>{courseId}</code>.
        </p>
      </div>
    )
  }

  const topicLocked = Boolean(topic.paidOnly && !paid)

  return (
    <Fragment>
      <CourseTopicDocument
        courseId={courseId}
        topicId={topicId}
        topicTitle={topic.title}
        topicLocked={topicLocked}
        progressEventName={courseProgressEventName(courseId)}
        seoSlot={<Seo title={`${topic.title} · ${courseTitle}`} />}
        topicLockedSlot={
          <PremiumSectionOverlay locked variant="topic">
            {null}
          </PremiumSectionOverlay>
        }
      />
    </Fragment>
  )
}
