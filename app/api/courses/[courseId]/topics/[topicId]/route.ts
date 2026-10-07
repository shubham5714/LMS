import { NextRequest, NextResponse } from "next/server"
import {
  isValidCourseId,
  isValidTopicId,
} from "@/shared/courses/course-structure"
import { assertMcpOrAdmin } from "@/shared/lib/assert-mcp-or-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"

export const runtime = "nodejs"

type Ctx = { params: Promise<{ courseId: string; topicId: string }> }

type PatchBody = {
  title?: string
  paidOnly?: boolean
  sortOrder?: number
}

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const { courseId, topicId } = await context.params
    if (!isValidCourseId(courseId) || !isValidTopicId(topicId)) {
      return NextResponse.json({ error: "Invalid ids" }, { status: 400 })
    }

    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as PatchBody
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (body.title !== undefined) patch.title = body.title.trim()
    if (body.paidOnly !== undefined) patch.paid_only = Boolean(body.paidOnly)
    if (body.sortOrder !== undefined)
      patch.sort_order = Number(body.sortOrder) || 0

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("course_topics")
      .update(patch)
      .eq("course_id", courseId)
      .eq("topic_id", topicId)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ topic: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  try {
    const { courseId, topicId } = await context.params
    if (!isValidCourseId(courseId) || !isValidTopicId(topicId)) {
      return NextResponse.json({ error: "Invalid ids" }, { status: 400 })
    }
    if (topicId === "overview") {
      return NextResponse.json(
        { error: "Cannot delete the overview topic" },
        { status: 400 }
      )
    }

    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

    const admin = createSupabaseAdminClient()
    await admin
      .from("course_topic_documents")
      .delete()
      .eq("course_id", courseId)
      .eq("topic_id", topicId)

    const { error } = await admin
      .from("course_topics")
      .delete()
      .eq("course_id", courseId)
      .eq("topic_id", topicId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}
