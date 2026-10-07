import { NextRequest, NextResponse } from "next/server"
import { applyLessonEdits } from "@/shared/courses/blocknote-edit-ops"
import { assertMcpOrAdmin } from "@/shared/lib/assert-mcp-or-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"

export const runtime = "nodejs"

type Body = {
  courseId?: string
  topicId?: string
  operations?: unknown
  /** updated_at from get_lesson; rejects the edit if the lesson changed since. */
  expectedUpdatedAt?: string
}

/**
 * Block-level lesson edits (replace / insert / delete by block id).
 * Human-managed blocks (embeds, premium markers) cannot be changed or removed.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as Body
    const courseId = body.courseId?.trim()
    const topicId = body.topicId?.trim()
    if (!courseId || !topicId) {
      return NextResponse.json(
        { error: "courseId and topicId are required" },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    const { data: current, error: loadError } = await admin
      .from("course_topic_documents")
      .select("blocks, updated_at")
      .eq("course_id", courseId)
      .eq("topic_id", topicId)
      .maybeSingle()

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 })
    }
    if (!current) {
      return NextResponse.json(
        { error: "Lesson not found; create it with write_lesson first" },
        { status: 404 }
      )
    }

    if (
      body.expectedUpdatedAt &&
      new Date(body.expectedUpdatedAt).getTime() !==
        new Date(current.updated_at).getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "Lesson changed since it was loaded; call get_lesson again and redo the edit",
          currentUpdatedAt: current.updated_at,
        },
        { status: 409 }
      )
    }

    const result = applyLessonEdits(
      Array.isArray(current.blocks) ? current.blocks : [],
      body.operations
    )
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          operationIndex: result.operationIndex,
          issues: result.issues,
        },
        { status: 400 }
      )
    }

    // Conditional on the loaded updated_at so a concurrent editor save is not overwritten.
    const { data: saved, error: saveError } = await admin
      .from("course_topic_documents")
      .update({
        blocks: result.blocks,
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      })
      .eq("course_id", courseId)
      .eq("topic_id", topicId)
      .eq("updated_at", current.updated_at)
      .select("course_id, topic_id, updated_at")
      .maybeSingle()

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }
    if (!saved) {
      return NextResponse.json(
        {
          error:
            "Lesson changed while editing; call get_lesson again and redo the edit",
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      ok: true,
      document: saved,
      insertedIds: result.insertedIds,
      blockCount: result.blocks.length,
    })
  } catch (e) {
    console.error("course-topics/document/edit POST:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    )
  }
}
