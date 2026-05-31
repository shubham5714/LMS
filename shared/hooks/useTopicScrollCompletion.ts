"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/shared/lib/supabase"
import { upsertTopicCompletion } from "@/shared/lib/courseTopicProgress"

type Options = {
  courseId: string
  topicId: string
  /** Fired after successful persist so sidebar can refresh */
  onPersisted?: () => void
}

/**
 * Marks topic complete when the user scrolls to the bottom of the document (window scroll).
 */
export function useTopicScrollCompletion({ courseId, topicId, onPersisted }: Options) {
  const doneRef = useRef(false)

  useEffect(() => {
    const tryComplete = async () => {
      if (doneRef.current) return
      const doc = document.documentElement
      const scrollBottom = window.scrollY + window.innerHeight
      const threshold = 80
      if (scrollBottom < doc.scrollHeight - threshold) return

      doneRef.current = true
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        doneRef.current = false
        return
      }
      const result = await upsertTopicCompletion(user.id, courseId, topicId)
      if (result.ok) {
        onPersisted?.()
      } else {
        doneRef.current = false
      }
    }

    const onScroll = () => {
      void tryComplete()
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    void tryComplete()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [courseId, topicId, onPersisted])
}
