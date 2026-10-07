import type { CatalogCourse, CourseFocusArea, CourseSkillLevel } from "@/shared/courses/catalog"

export type DbCourse = {
  id: string
  title: string
  description: string
  focus_area: string
  skill_level: string
  icon: string
  logo_url?: string | null
  students_label: string
  duration_hours: number
  modules: number
  lessons: number
  instructor_name: string
  sort_order: number
  published: boolean
}

export type DbCourseTopic = {
  course_id: string
  topic_id: string
  title: string
  sort_order: number
  paid_only: boolean
}

export type CourseTopicNavItem = {
  id: string
  title: string
  path: string
  paidOnly?: boolean
}

export const COURSE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const TOPIC_ID_PATTERN = COURSE_ID_PATTERN

export function isValidCourseId(id: string): boolean {
  return COURSE_ID_PATTERN.test(id) && id.length <= 64
}

export function isValidTopicId(id: string): boolean {
  return TOPIC_ID_PATTERN.test(id) && id.length <= 64
}

/** `/courses/foo` or `/courses/foo/bar` → courseId */
export function parseCourseIdFromPathname(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, "") || "/"
  const match = normalized.match(/^\/courses\/([^/]+)/)
  if (!match) return null
  const id = match[1]
  if (id === "manage") return null
  return id
}

/** Topic segment from `/courses/:courseId/:topicId` (overview when missing). */
export function parseTopicIdFromPathname(
  pathname: string,
  courseId: string
): string {
  const normalized = pathname.replace(/\/$/, "") || "/"
  const prefix = `/courses/${courseId}`
  if (normalized === prefix) return "overview"
  if (normalized.startsWith(`${prefix}/`)) {
    const rest = normalized.slice(prefix.length + 1)
    const topicId = rest.split("/")[0]
    return topicId || "overview"
  }
  return "overview"
}

export function courseHref(courseId: string): string {
  return `/courses/${courseId}`
}

export function topicHref(courseId: string, topicId: string): string {
  if (topicId === "overview") return courseHref(courseId)
  return `/courses/${courseId}/${topicId}`
}

export function courseProgressEventName(courseId: string): string {
  return `course-progress-updated:${courseId}`
}

export function dbCourseToCatalog(row: DbCourse): CatalogCourse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    href: courseHref(row.id),
    focusArea: row.focus_area as CourseFocusArea,
    skillLevel: row.skill_level as CourseSkillLevel,
    icon: row.icon,
    logoUrl: row.logo_url || undefined,
    studentsLabel: row.students_label,
    durationHours: row.duration_hours,
    modules: row.modules,
    lessons: row.lessons,
    instructor: { name: row.instructor_name },
  }
}

export function topicsToNavItems(
  courseId: string,
  topics: readonly DbCourseTopic[]
): CourseTopicNavItem[] {
  return [...topics]
    .sort((a, b) => a.sort_order - b.sort_order || a.topic_id.localeCompare(b.topic_id))
    .map((t) => ({
      id: t.topic_id,
      title: t.title,
      path: topicHref(courseId, t.topic_id),
      paidOnly: t.paid_only || undefined,
    }))
}

export function slugifyId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}
