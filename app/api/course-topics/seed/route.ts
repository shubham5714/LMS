import { NextResponse } from "next/server"
import { BLOCKNOTE_SEED_DOCUMENTS } from "@/shared/courses/blocknote-seed-documents"
import { isContentEditor } from "@/shared/courses/membership-roles"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export const runtime = "nodejs"

/**
 * Upserts seed BlockNote documents for all known course topics.
 * ADMIN only. Safe to re-run; overwrites existing rows with seed content.
 */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const { data: membershipRow, error: memError } = await admin
      .from("user_memberships")
      .select("membership")
      .eq("user_id", user.id)
      .maybeSingle()

    if (memError || !isContentEditor(membershipRow?.membership)) {
      return NextResponse.json(
        { error: "Only ADMIN membership can seed course documents" },
        { status: 403 }
      )
    }

    const rows: {
      course_id: string
      topic_id: string
      blocks: unknown
      updated_at: string
      updated_by: string
    }[] = []

    const now = new Date().toISOString()
    for (const [courseId, topics] of Object.entries(BLOCKNOTE_SEED_DOCUMENTS)) {
      for (const [topicId, blocks] of Object.entries(topics)) {
        rows.push({
          course_id: courseId,
          topic_id: topicId,
          blocks,
          updated_at: now,
          updated_by: user.id,
        })
      }
    }

    const { error } = await admin.from("course_topic_documents").upsert(rows, {
      onConflict: "course_id,topic_id",
    })

    if (error) {
      console.error("seed course_topic_documents failed:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, upserted: rows.length })
  } catch (e) {
    console.error("course-topics/seed POST:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    )
  }
}
