import { SECURONIX_SIEM_TOPICS } from "@/shared/courses/securonix-siem-config"
import { SOC_FUNDAMENTALS_TOPICS } from "@/shared/courses/soc-fundamentals-config"
import { supabase } from "@/shared/lib/supabase"

const TABLE = "user_course_topic_progress"

export type CourseProgress = {
  courseId: string
  totalTopics: number
  completedTopics: number
  /** 0–100 */
  percent: number
}

function staticTopicIds(courseId: string): string[] {
  if (courseId === "soc-fundamentals") {
    return SOC_FUNDAMENTALS_TOPICS.map((t) => t.id)
  }
  if (courseId === "securonix-siem") {
    return SECURONIX_SIEM_TOPICS.map((t) => t.id)
  }
  return []
}

export function computeCourseProgress(
  totalTopics: number,
  completedTopicIds: readonly string[],
  availableTopicIds: ReadonlySet<string>
): Pick<CourseProgress, "totalTopics" | "completedTopics" | "percent"> {
  const completedTopics =
    availableTopicIds.size === 0
      ? 0
      : completedTopicIds.filter((id) => availableTopicIds.has(id)).length
  const total = Math.max(0, totalTopics)
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((completedTopics / total) * 100))
  return { totalTopics: total, completedTopics, percent }
}

/**
 * Progress for catalog cards: completed topics that still exist / total topics.
 * Unauthenticated users get 0 completed.
 */
export async function fetchCatalogCourseProgress(
  courseIds: readonly string[]
): Promise<Record<string, CourseProgress>> {
  const result: Record<string, CourseProgress> = {}
  for (const courseId of courseIds) {
    result[courseId] = {
      courseId,
      totalTopics: 0,
      completedTopics: 0,
      percent: 0,
    }
  }
  if (courseIds.length === 0) return result

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: topicRows, error: topicsError } = await supabase
    .from("course_topics")
    .select("course_id, topic_id")
    .in("course_id", [...courseIds])

  const topicsByCourse = new Map<string, Set<string>>()
  for (const id of courseIds) {
    topicsByCourse.set(id, new Set())
  }

  if (!topicsError && topicRows?.length) {
    for (const row of topicRows) {
      const courseId = row.course_id as string
      const topicId = row.topic_id as string
      if (!topicsByCourse.has(courseId)) topicsByCourse.set(courseId, new Set())
      topicsByCourse.get(courseId)!.add(topicId)
    }
  }

  // Fallback to static topic lists when DB has no rows for a course
  for (const courseId of courseIds) {
    const set = topicsByCourse.get(courseId)!
    if (set.size === 0) {
      for (const id of staticTopicIds(courseId)) set.add(id)
    }
  }

  let completedByCourse = new Map<string, string[]>()
  if (user) {
    const { data: progressRows, error: progressError } = await supabase
      .from(TABLE)
      .select("course_id, topic_id")
      .eq("user_id", user.id)
      .in("course_id", [...courseIds])

    if (progressError) {
      console.error("fetchCatalogCourseProgress:", progressError)
    } else {
      for (const row of progressRows ?? []) {
        const courseId = row.course_id as string
        const topicId = row.topic_id as string
        const list = completedByCourse.get(courseId) ?? []
        list.push(topicId)
        completedByCourse.set(courseId, list)
      }
    }
  }

  for (const courseId of courseIds) {
    const available = topicsByCourse.get(courseId) ?? new Set<string>()
    const completed = completedByCourse.get(courseId) ?? []
    const stats = computeCourseProgress(available.size, completed, available)
    result[courseId] = { courseId, ...stats }
  }

  return result
}

export async function fetchCompletedTopicIds(
  userId: string,
  courseId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("topic_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)

  if (error) {
    console.error("fetchCompletedTopicIds:", error)
    return []
  }
  return (data ?? []).map((r) => r.topic_id as string)
}

export async function upsertTopicCompletion(
  userId: string,
  courseId: string,
  topicId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      course_id: courseId,
      topic_id: topicId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id,topic_id" }
  )

  if (error) {
    console.error("upsertTopicCompletion:", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
