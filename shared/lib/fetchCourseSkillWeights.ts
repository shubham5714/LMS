import type { CourseSkillWeight } from "@/shared/lib/skillRadar"
import { supabase } from "@/shared/lib/supabase"

/** Load skill weights for the given courses (dashboard radar). */
export async function fetchCourseSkillWeights(
  courseIds: readonly string[]
): Promise<CourseSkillWeight[]> {
  if (courseIds.length === 0) return []

  const { data, error } = await supabase
    .from("course_skills")
    .select("course_id, skill_id, weight, skills(name)")
    .in("course_id", [...courseIds])

  if (error) {
    console.error("fetchCourseSkillWeights:", error)
    return []
  }

  return (data || []).map((row) => {
    const joined = row.skills as { name?: string } | { name?: string }[] | null
    const nameFromJoin = Array.isArray(joined)
      ? joined[0]?.name
      : joined?.name
    return {
      courseId: row.course_id as string,
      skillId: row.skill_id as string,
      skillName: nameFromJoin || (row.skill_id as string),
      weight: Number(row.weight) || 1,
    }
  })
}
