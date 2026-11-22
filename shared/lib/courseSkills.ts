import { slugifyId } from "@/shared/courses/course-structure"
import type { SupabaseClient } from "@supabase/supabase-js"

export type CourseSkillInput = {
  name: string
  weight: number
}

export type CourseSkillRow = {
  skill_id: string
  name: string
  weight: number
}

export function normalizeCourseSkillInputs(
  skills: readonly CourseSkillInput[] | undefined | null
): CourseSkillInput[] {
  if (!skills?.length) return []

  const byId = new Map<string, CourseSkillInput>()
  for (const raw of skills) {
    const name = raw.name?.trim()
    if (!name) continue
    const id = slugifyId(name)
    if (!id) continue
    const weight = Number(raw.weight)
    if (!Number.isFinite(weight) || weight <= 0) continue
    // Last duplicate name wins
    byId.set(id, { name, weight })
  }
  return [...byId.values()]
}

/**
 * Upsert skill rows and replace all course_skills for a course.
 * Pass empty array to clear skills.
 */
export async function replaceCourseSkills(
  admin: SupabaseClient,
  courseId: string,
  skills: readonly CourseSkillInput[]
): Promise<{ ok: true; skills: CourseSkillRow[] } | { ok: false; error: string }> {
  const normalized = normalizeCourseSkillInputs(skills)

  const { error: deleteError } = await admin
    .from("course_skills")
    .delete()
    .eq("course_id", courseId)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  if (normalized.length === 0) {
    return { ok: true, skills: [] }
  }

  const rows = normalized.map((s) => {
    const id = slugifyId(s.name)
    return { id, name: s.name.trim(), weight: s.weight }
  })

  const { error: upsertSkillsError } = await admin
    .from("skills")
    .upsert(
      rows.map(({ id, name }) => ({ id, name })),
      { onConflict: "id" }
    )

  if (upsertSkillsError) {
    return { ok: false, error: upsertSkillsError.message }
  }

  const { error: insertError } = await admin.from("course_skills").insert(
    rows.map(({ id, weight }) => ({
      course_id: courseId,
      skill_id: id,
      weight,
    }))
  )

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  return {
    ok: true,
    skills: rows.map(({ id, name, weight }) => ({
      skill_id: id,
      name,
      weight,
    })),
  }
}

export async function fetchCourseSkills(
  admin: SupabaseClient,
  courseId: string
): Promise<{ ok: true; skills: CourseSkillRow[] } | { ok: false; error: string }> {
  const { data, error } = await admin
    .from("course_skills")
    .select("skill_id, weight, skills(name)")
    .eq("course_id", courseId)

  if (error) {
    return { ok: false, error: error.message }
  }

  const skills: CourseSkillRow[] = (data || []).map((row) => {
    const joined = row.skills as { name?: string } | { name?: string }[] | null
    const nameFromJoin = Array.isArray(joined)
      ? joined[0]?.name
      : joined?.name
    return {
      skill_id: row.skill_id as string,
      name: nameFromJoin || (row.skill_id as string),
      weight: Number(row.weight) || 1,
    }
  })

  skills.sort((a, b) => a.name.localeCompare(b.name))
  return { ok: true, skills }
}
