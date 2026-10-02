"use client"

import { DbCourseTopicLesson } from "@/shared/components/courses/DbCourseTopicLesson"
import React from "react"

type Props = {
  params: Promise<{ courseId: string }>
}

export default function CourseOverviewPage({ params }: Props) {
  const { courseId } = React.use(params)
  return <DbCourseTopicLesson courseId={courseId} topicId="overview" />
}
