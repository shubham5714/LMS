import { CATALOG_COURSES } from "@/shared/courses/catalog"
import {
  dbCourseToCatalog,
  topicsToNavItems,
  type CourseTopicNavItem,
  type DbCourse,
  type DbCourseTopic,
} from "@/shared/courses/course-structure"
import { SECURONIX_SIEM_TOPICS } from "@/shared/courses/securonix-siem-config"
import { SOC_FUNDAMENTALS_TOPICS } from "@/shared/courses/soc-fundamentals-config"
import { supabase } from "@/shared/lib/supabase"
import type { CatalogCourse } from "@/shared/courses/catalog"

function staticTopicsFallback(courseId: string): CourseTopicNavItem[] {
  if (courseId === "soc-fundamentals") {
    return SOC_FUNDAMENTALS_TOPICS.map((t) => ({
      id: t.id,
      title: t.title,
      path: t.path,
      paidOnly: t.paidOnly,
    }))
  }
  if (courseId === "securonix-siem") {
    return SECURONIX_SIEM_TOPICS.map((t) => ({
      id: t.id,
      title: t.title,
      path: t.path,
      paidOnly: t.paidOnly,
    }))
  }
  return []
}

export async function fetchCatalogCoursesFromDb(): Promise<CatalogCourse[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, description, focus_area, skill_level, icon, logo_url, students_label, duration_hours, modules, lessons, instructor_name, sort_order, published"
    )
    .eq("published", true)
    .order("sort_order", { ascending: true })

  if (error || !data?.length) {
    if (error) console.warn("courses catalog fallback:", error.message)
    return [...CATALOG_COURSES]
  }

  return (data as DbCourse[]).map(dbCourseToCatalog)
}

export async function fetchCourseById(
  courseId: string
): Promise<DbCourse | null> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, description, focus_area, skill_level, icon, logo_url, students_label, duration_hours, modules, lessons, instructor_name, sort_order, published"
    )
    .eq("id", courseId)
    .maybeSingle()

  if (error) {
    console.warn("fetchCourseById:", error.message)
    const fallback = CATALOG_COURSES.find((c) => c.id === courseId)
    if (!fallback) return null
    return {
      id: fallback.id,
      title: fallback.title,
      description: fallback.description,
      focus_area: fallback.focusArea,
      skill_level: fallback.skillLevel,
      icon: fallback.icon,
      logo_url: fallback.logoUrl ?? null,
      students_label: fallback.studentsLabel,
      duration_hours: fallback.durationHours,
      modules: fallback.modules,
      lessons: fallback.lessons,
      instructor_name: fallback.instructor.name,
      sort_order: 0,
      published: true,
    }
  }

  return (data as DbCourse | null) ?? null
}

export async function fetchCourseTopics(
  courseId: string
): Promise<CourseTopicNavItem[]> {
  const { data, error } = await supabase
    .from("course_topics")
    .select("course_id, topic_id, title, sort_order, paid_only")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })

  if (error || !data?.length) {
    if (error) console.warn("fetchCourseTopics fallback:", error.message)
    return staticTopicsFallback(courseId)
  }

  return topicsToNavItems(courseId, data as DbCourseTopic[])
}

export async function fetchCourseTopic(
  courseId: string,
  topicId: string
): Promise<CourseTopicNavItem | null> {
  const topics = await fetchCourseTopics(courseId)
  return topics.find((t) => t.id === topicId) ?? null
}
