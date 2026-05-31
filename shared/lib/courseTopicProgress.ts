import { supabase } from "@/shared/lib/supabase"

const TABLE = "user_course_topic_progress"

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
