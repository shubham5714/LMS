import { NextRequest, NextResponse } from "next/server"
import { isValidCourseId } from "@/shared/courses/course-structure"
import {
  assertMcpOrAdmin,
  assertMcpOrAuthenticated,
} from "@/shared/lib/assert-mcp-or-admin"
import {
  fetchCourseSkills,
  normalizeCourseSkillInputs,
  replaceCourseSkills,
  type CourseSkillInput,
  type CourseSkillRow,
} from "@/shared/lib/courseSkills"
import { createSupabaseAdminClient } from "@/shared/lib/supabase-admin"

export const runtime = "nodejs"

type PatchBody = {
  title?: string
  description?: string
  focusArea?: string
  skillLevel?: string
  icon?: string
  logoUrl?: string | null
  studentsLabel?: string
  durationHours?: number
  modules?: number
  lessons?: number
  instructorName?: string
  published?: boolean
  sortOrder?: number
  skills?: CourseSkillInput[]
}

type Ctx = { params: Promise<{ courseId: string }> }

export async function GET(request: NextRequest, context: Ctx) {
  try {
    const { courseId } = await context.params
    if (!isValidCourseId(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }

    const auth = await assertMcpOrAuthenticated(request)
    if (!auth.ok) return auth.response

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

    if (!course.published && !auth.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { data: topics } = await admin
      .from("course_topics")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })

    const skillsResult = await fetchCourseSkills(admin, courseId)
    if (!skillsResult.ok) {
      return NextResponse.json({ error: skillsResult.error }, { status: 500 })
    }

    return NextResponse.json({
      course,
      topics: topics || [],
      skills: skillsResult.skills,
    })
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
    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as PatchBody
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (body.title !== undefined) patch.title = body.title.trim()
    if (body.description !== undefined) patch.description = body.description.trim()
    if (body.focusArea !== undefined) patch.focus_area = body.focusArea.trim()
    if (body.skillLevel !== undefined) patch.skill_level = body.skillLevel.trim()
    if (body.icon !== undefined) patch.icon = body.icon.trim()
    if (body.logoUrl !== undefined) {
      patch.logo_url = body.logoUrl === null ? null : body.logoUrl.trim() || null
    }
    if (body.studentsLabel !== undefined)
      patch.students_label = body.studentsLabel.trim()
    if (body.durationHours !== undefined)
      patch.duration_hours = Number(body.durationHours) || 0
    if (body.modules !== undefined) patch.modules = Number(body.modules) || 0
    if (body.lessons !== undefined) patch.lessons = Number(body.lessons) || 0
    if (body.instructorName !== undefined)
      patch.instructor_name = body.instructorName.trim()
    // MCP cannot publish — human review in manage UI.
    if (body.published !== undefined && !auth.viaMcp) {
      patch.published = Boolean(body.published)
    }
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

    let skills: CourseSkillRow[] | undefined
    if (body.skills !== undefined) {
      const skillResult = await replaceCourseSkills(
        admin,
        courseId,
        normalizeCourseSkillInputs(body.skills)
      )
      if (!skillResult.ok) {
        return NextResponse.json({ error: skillResult.error }, { status: 500 })
      }
      skills = skillResult.skills
    } else {
      const skillsResult = await fetchCourseSkills(admin, courseId)
      if (skillsResult.ok) skills = skillsResult.skills
    }

    return NextResponse.json({ course: data, skills })
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
    const { courseId } = await context.params
    const auth = await assertMcpOrAdmin(request)
    if (!auth.ok) return auth.response

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
