import { NextRequest, NextResponse } from "next/server"
import {
  dbCourseToCatalog,
  isValidCourseId,
  slugifyId,
  type DbCourse,
} from "@/shared/courses/course-structure"
import {
  assertMcpOrAdmin,
  assertMcpOrAuthenticated,
} from "@/shared/lib/assert-mcp-or-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"

export const runtime = "nodejs"

type CreateBody = {
  id?: string
  title?: string
  description?: string
  focusArea?: string
  skillLevel?: string
  icon?: string
  logoUrl?: string
  studentsLabel?: string
  durationHours?: number
  modules?: number
  lessons?: number
  instructorName?: string
  published?: boolean
  /** First topic title; topic_id defaults to overview */
  overviewTitle?: string
}

export async function GET(request: NextRequest) {
  try {
    const auth = await assertMcpOrAuthenticated(request)
    if (!auth.ok) return auth.response

    const admin = createSupabaseAdminClient()
    let query = admin
      .from("courses")
      .select(
        "id, title, description, focus_area, skill_level, icon, logo_url, students_label, duration_hours, modules, lessons, instructor_name, sort_order, published"
      )
      .order("sort_order", { ascending: true })

    if (!auth.isAdmin) {
      query = query.eq("published", true)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      courses: ((data || []) as DbCourse[]).map(dbCourseToCatalog),
      raw: data || [],
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list courses" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as CreateBody
    const title = body.title?.trim()
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const id = (body.id?.trim() || slugifyId(title)).toLowerCase()
    if (!isValidCourseId(id)) {
      return NextResponse.json(
        {
          error:
            "id must be a URL slug (lowercase letters, numbers, hyphens), e.g. my-course",
        },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    const { data: maxSort } = await admin
      .from("courses")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const sort_order = (maxSort?.sort_order ?? 0) + 10

    // MCP creates are always unpublished for human review.
    const published = auth.viaMcp ? false : body.published !== false

    const row = {
      id,
      title,
      description: body.description?.trim() || "",
      focus_area: body.focusArea?.trim() || "Security Operations",
      skill_level: body.skillLevel?.trim() || "Beginner",
      icon: body.icon?.trim() || "ri-book-open-line",
      logo_url: body.logoUrl?.trim() || null,
      students_label: body.studentsLabel?.trim() || "0 students",
      duration_hours: Number(body.durationHours) || 0,
      modules: Number(body.modules) || 0,
      lessons: Number(body.lessons) || 0,
      instructor_name: body.instructorName?.trim() || "SOC Academy",
      sort_order,
      published,
      updated_at: new Date().toISOString(),
    }

    const { data: course, error } = await admin
      .from("courses")
      .insert(row)
      .select()
      .single()

    if (error) {
      const status = error.code === "23505" ? 409 : 500
      return NextResponse.json({ error: error.message }, { status })
    }

    const overviewTitle = body.overviewTitle?.trim() || "Overview"
    const { error: topicError } = await admin.from("course_topics").insert({
      course_id: id,
      topic_id: "overview",
      title: overviewTitle,
      sort_order: 10,
      paid_only: false,
    })

    if (topicError) {
      console.error("Failed to create overview topic:", topicError)
    }

    // Empty lesson body so BlockNote opens without seed miss
    await admin.from("course_topic_documents").upsert(
      {
        course_id: id,
        topic_id: "overview",
        blocks: [
          {
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: overviewTitle, styles: {} }],
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
        updated_by: auth.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "course_id,topic_id" }
    )

    return NextResponse.json({ course }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create course" },
      { status: 500 }
    )
  }
}
