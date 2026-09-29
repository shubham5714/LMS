export type CourseFocusArea =
  | "Security Operations"
  | "SIEM"
  | "Threat Detection"
  | "Cloud Security"

export type CourseSkillLevel = "Beginner" | "Intermediate" | "Advanced"

export type CatalogCourse = {
  id: string
  title: string
  description: string
  href: string
  focusArea: CourseFocusArea
  skillLevel: CourseSkillLevel
  icon: string
  studentsLabel: string
  durationHours: number
  modules: number
  lessons: number
  instructor: {
    name: string
    avatarSrc?: string
  }
}

export const COURSE_FOCUS_AREAS: readonly CourseFocusArea[] = [
  "Security Operations",
  "SIEM",
  "Threat Detection",
  "Cloud Security",
] as const

export const COURSE_SKILL_LEVELS: readonly CourseSkillLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const

export const CATALOG_COURSES: readonly CatalogCourse[] = [
  {
    id: "soc-fundamentals",
    title: "SOC Fundamentals",
    description:
      "Core security operations concepts: roles, threat lifecycle, triage, SIEM basics, and log analysis for day-one analysts.",
    href: "/courses/soc-fundamentals",
    focusArea: "Security Operations",
    skillLevel: "Beginner",
    icon: "ri-graduation-cap-fill",
    studentsLabel: "2.4K students",
    durationHours: 6,
    modules: 6,
    lessons: 28,
    instructor: { name: "SOC Academy" },
  },
  {
    id: "securonix-siem",
    title: "Securonix SIEM",
    description:
      "Platform architecture, tenant activation, UI tour, AI agents, and Hub installation to operate Securonix in production.",
    href: "/courses/securonix-siem",
    focusArea: "SIEM",
    skillLevel: "Intermediate",
    icon: "ri-radar-fill",
    studentsLabel: "1.1K students",
    durationHours: 9,
    modules: 6,
    lessons: 42,
    instructor: { name: "Securonix Lab" },
  },
]

export function filterCatalogCourses(
  courses: readonly CatalogCourse[],
  focusArea: string,
  skillLevel: string
): CatalogCourse[] {
  return courses.filter((c) => {
    const focusOk = focusArea === "all" || c.focusArea === focusArea
    const skillOk = skillLevel === "all" || c.skillLevel === skillLevel
    return focusOk && skillOk
  })
}
