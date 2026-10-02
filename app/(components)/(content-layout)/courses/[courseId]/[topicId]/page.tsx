"use client"

import { DbCourseTopicLesson } from "@/shared/components/courses/DbCourseTopicLesson"
import React from "react"

type Props = {
  params: Promise<{ courseId: string; topicId: string }>
}

export default function CourseTopicPage({ params }: Props) {
  const { courseId, topicId } = React.use(params)
  return <DbCourseTopicLesson courseId={courseId} topicId={topicId} />
}
