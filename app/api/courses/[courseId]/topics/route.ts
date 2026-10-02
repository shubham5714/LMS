import { NextRequest, NextResponse } from "next/server"
import {
  isValidCourseId,
  isValidTopicId,
  slugifyId,
} from "@/shared/courses/course-structure"
import { assertAdminMembership } from "@/shared/lib/assert-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export const runtime = "nodejs"

type Ctx = { params: Promise<{ courseId: string }> }

type CreateTopicBody = {
  topicId?: string
  title?: string
  paidOnly?: boolean
  sortOrder?: number
}

export async function GET(_request: NextRequest, context: Ctx) {
  try {
    const { courseId } = await context.params
    if (!isValidCourseId(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("course_topics")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ topics: data || [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: Ctx) {
  try {
    const { courseId } = await context.params
    if (!isValidCourseId(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!(await assertAdminMembership(user.id))) {
      return NextResponse.json({ error: "ADMIN only" }, { status: 403 })
    }

    const body = (await request.json()) as CreateTopicBody
    const title = body.title?.trim()
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const topicId = (body.topicId?.trim() || slugifyId(title)).toLowerCase()
    if (!isValidTopicId(topicId)) {
      return NextResponse.json(
        {
          error:
            "topicId must be a URL slug (lowercase letters, numbers, hyphens)",
        },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()

    const { data: course } = await admin
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .maybeSingle()
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    let sort_order = body.sortOrder
    if (sort_order == null) {
      const { data: maxSort } = await admin
        .from("course_topics")
        .select("sort_order")
        .eq("course_id", courseId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
      sort_order = (maxSort?.sort_order ?? 0) + 10
    }

    const { data: topic, error } = await admin
      .from("course_topics")
      .insert({
        course_id: courseId,
        topic_id: topicId,
        title,
        sort_order,
        paid_only: Boolean(body.paidOnly),
      })
      .select()
      .single()

    if (error) {
      const status = error.code === "23505" ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }

    await admin.from("course_topic_documents").upsert(
      {
        course_id: courseId,
        topic_id: topicId,
        blocks: [
          {
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: title, styles: {} }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Start writing this lesson…",
                styles: {},
              },
            ],
          },
        ],
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "course_id,topic_id" }
    )

    return NextResponse.json({ topic }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}
