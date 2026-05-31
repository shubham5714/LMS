export const SECURONIX_SIEM_COURSE_ID = "securonix-siem" as const

export type SecuronixSiemTopic = {
  id: string
  title: string
  path: string
}

export const SECURONIX_SIEM_TOPICS: readonly SecuronixSiemTopic[] = [
  {
    id: "overview",
    title: "Securonix SIEM Overview",
    path: "/courses/securonix-siem",
  },
] as const

export const SECURONIX_SIEM_ROUTE_PREFIX = "/courses/securonix-siem" as const

export const SECURONIX_SIEM_DISPLAY_NAME = "Securonix SIEM"

export function getSecuronixSiemTopicForPathname(
  pathname: string
): SecuronixSiemTopic | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/"
  const longestFirst = [...SECURONIX_SIEM_TOPICS].sort((a, b) => b.path.length - a.path.length)
  return longestFirst.find((t) => normalized === t.path || normalized.startsWith(`${t.path}/`))
}

export const SECURONIX_COURSE_PROGRESS_UPDATED_EVENT =
  "securonix-siem-course-progress-updated" as const

export type SecuronixSiemOutlineItem = {
  id: string
  title: string
  level: 0 | 1
  paidOnly?: boolean
  premiumPreviewSrc?: string
}

export function hasPaidMembership(membership: string | null | undefined): boolean {
  if (membership == null || membership === "") return false
  return membership.trim().toUpperCase() !== "FREE"
}

export const SECURONIX_SIEM_OUTLINE: Record<
  string,
  readonly SecuronixSiemOutlineItem[]
> = {
  overview: [
    { id: "introduction", title: "Introduction", level: 0 },
    { id: "what-is-securonix", title: "What is Securonix SIEM?", level: 0 },
    { id: "platform-capabilities", title: "Platform capabilities", level: 1 },
    { id: "data-sources", title: "Data sources & ingestion", level: 1 },
    { id: "use-cases", title: "Common SOC use cases", level: 0 },
    { id: "getting-started", title: "Getting started in the console", level: 0 },
  ],
}

export function getTopicOutline(topicId: string): readonly SecuronixSiemOutlineItem[] {
  return SECURONIX_SIEM_OUTLINE[topicId] ?? []
}
