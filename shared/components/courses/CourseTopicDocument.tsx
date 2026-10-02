"use client"

import { getSeedBlocks } from "@/shared/courses/blocknote-seed-documents"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import { hasPaidMembership } from "@/shared/courses/membership-roles"
import { useTopicScrollCompletion } from "@/shared/hooks/useTopicScrollCompletion"
import { supabase } from "@/shared/lib/supabase"
import dynamic from "next/dynamic"
import React, { useCallback, useEffect, useState } from "react"
import type { CourseTopicDocumentEditorProps } from "./CourseTopicDocumentEditor"

const CourseTopicDocumentEditor = dynamic(
  () => import("./CourseTopicDocumentEditor"),
  {
    ssr: false,
    loading: () => <p className="text-muted">Loading lesson…</p>,
  }
)

type Props = {
  courseId: string
  topicId: string
  topicTitle: string
  /** Full-topic premium gate (from TS topic config). */
  topicLocked?: boolean
  progressEventName: string
  seoSlot?: React.ReactNode
  topicLockedSlot?: React.ReactNode
}

type LoadState = "loading" | "ready" | "error"

export function CourseTopicDocument({
  courseId,
  topicId,
  topicTitle,
  topicLocked = false,
  progressEventName,
  seoSlot,
  topicLockedSlot,
}: Props) {
  const { membership, canEditCourseContent, isLoading: membershipLoading } =
    useMembershipContext()
  const paid = hasPaidMembership(membership)
  const canEdit = canEditCourseContent

  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [initialBlocks, setInitialBlocks] = useState<unknown[] | null>(null)
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadState("loading")
      setLoadError(null)
      try {
        const { data, error } = await supabase
          .from("course_topic_documents")
          .select("blocks")
          .eq("course_id", courseId)
          .eq("topic_id", topicId)
          .maybeSingle()

        if (cancelled) return

        if (error) {
          console.warn("course_topic_documents load:", error.message)
          setInitialBlocks(getSeedBlocks(courseId, topicId))
          setLoadState("ready")
          return
        }

        const blocks = data?.blocks
        if (Array.isArray(blocks) && blocks.length > 0) {
          setInitialBlocks(blocks)
        } else {
          setInitialBlocks(getSeedBlocks(courseId, topicId))
        }
        setLoadState("ready")
      } catch (e) {
        if (cancelled) return
        console.error(e)
        setInitialBlocks(getSeedBlocks(courseId, topicId))
        setLoadState("ready")
        setLoadError(e instanceof Error ? e.message : "Failed to load document")
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId, topicId])

  const notifyProgress = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent(progressEventName, { detail: { topicId } })
    )
  }, [progressEventName, topicId])

  useTopicScrollCompletion({
    courseId,
    topicId,
    onPersisted: notifyProgress,
    enabled: !topicLocked,
  })

  if (topicLocked) {
    return (
      <>
        {seoSlot}
        <div className="soc-fundamentals-topic course-topic-lesson">
          <div className="soc-fundamentals-topic-layout">
            <div className="soc-fundamentals-topic-main">
              <h1 className="course-topic-lesson__title">{topicTitle}</h1>
              {topicLockedSlot}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (membershipLoading || loadState === "loading" || initialBlocks == null) {
    return (
      <>
        {seoSlot}
        <div className="soc-fundamentals-topic course-topic-lesson">
          <div className="soc-fundamentals-topic-layout">
            <div className="soc-fundamentals-topic-main">
              <h1 className="course-topic-lesson__title">{topicTitle}</h1>
              <p className="text-muted">Loading lesson…</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  const editorProps: CourseTopicDocumentEditorProps = {
    courseId,
    topicId,
    topicTitle,
    initialBlocks,
    canEdit,
    hasPaidAccess: paid,
    seoSlot,
    loadError,
    dirty,
    setDirty,
    saveState,
    setSaveState,
    saveError,
    setSaveError,
  }

  return (
    <CourseTopicDocumentEditor
      key={`${courseId}:${topicId}:${canEdit ? "edit" : "read"}`}
      {...editorProps}
    />
  )
}
