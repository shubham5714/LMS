import { NextRequest, NextResponse } from "next/server"
import { isValidCourseId } from "@/shared/courses/course-structure"
import { assertAdminMembership } from "@/shared/lib/assert-admin"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

export const runtime = "nodejs"

type PatchBody = {
  title?: string
  description?: string
  focusArea?: string
  skillLevel?: string
  icon?: string
  studentsLabel?: string
  durationHours?: number
  modules?: number
  lessons?: number
  instructorName?: string
  published?: boolean
  sortOrder?: number
}

type Ctx = { params: Promise<{ courseId: string }> }

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
    const { data: course, error } = await admin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const isAdmin = await assertAdminMembership(user.id)
    if (!course.published && !isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { data: topics } = await admin
      .from("course_topics")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })

    return NextResponse.json({ course, topics: topics || [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const { courseId } = await context.params
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

    const body = (await request.json()) as PatchBody
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (body.title !== undefined) patch.title = body.title.trim()
    if (body.description !== undefined) patch.description = body.description.trim()
    if (body.focusArea !== undefined) patch.focus_area = body.focusArea.trim()
    if (body.skillLevel !== undefined) patch.skill_level = body.skillLevel.trim()
    if (body.icon !== undefined) patch.icon = body.icon.trim()
    if (body.studentsLabel !== undefined)
      patch.students_label = body.studentsLabel.trim()
    if (body.durationHours !== undefined)
      patch.duration_hours = Number(body.durationHours) || 0
    if (body.modules !== undefined) patch.modules = Number(body.modules) || 0
    if (body.lessons !== undefined) patch.lessons = Number(body.lessons) || 0
    if (body.instructorName !== undefined)
      patch.instructor_name = body.instructorName.trim()
    if (body.published !== undefined) patch.published = Boolean(body.published)
    if (body.sortOrder !== undefined) patch.sort_order = Number(body.sortOrder) || 0

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from("courses")
      .update(patch)
      .eq("id", courseId)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ course: data })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  try {
    const { courseId } = await context.params
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

    const admin = createSupabaseAdminClient()
    // Documents cascade is not FK-linked; delete explicitly
    await admin
      .from("course_topic_documents")
      .delete()
      .eq("course_id", courseId)

    const { error } = await admin.from("courses").delete().eq("id", courseId)
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
