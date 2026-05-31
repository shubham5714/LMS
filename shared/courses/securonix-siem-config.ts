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
  {
    id: "tenant-activation",
    title: "Tenant Activation by Securonix",
    path: "/courses/securonix-siem/tenant-activation",
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
  /** Public path under /public, e.g. /assets/images/... */
  imageSrc?: string
  imageAlt?: string
  /** Section heading only (no body block); used for group titles */
  headingOnly?: boolean
  /** Omit from the “On this page” nav (content still renders on the page) */
  hideFromNav?: boolean
  /** When hidden from nav, highlight this parent id in the nav while scrolled */
  navGroupId?: string
  /** Hide in-page h2/h3 when it duplicates the topic title */
  suppressHeading?: boolean
}

export type SecuronixSectionComparison = {
  traditional: string
  securonix: string
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
    {
      id: "market-positioning",
      title: "Market Positioning",
      level: 0,
      imageSrc: "/assets/images/courses/securonix_siem/securonix_gartner.png",
      imageAlt: "Gartner Magic Quadrant — Securonix",
    },
    {
      id: "differs-from-traditional",
      title: "How it differs from traditional SIEMs",
      level: 0,
      headingOnly: true,
    },
    {
      id: "diff-architecture",
      title: "Architecture",
      level: 1,
      hideFromNav: true,
      navGroupId: "differs-from-traditional",
    },
    {
      id: "diff-detection",
      title: "Detection Approach",
      level: 1,
      hideFromNav: true,
      navGroupId: "differs-from-traditional",
    },
    {
      id: "diff-deployment",
      title: "Deployment & Maintenance",
      level: 1,
      hideFromNav: true,
      navGroupId: "differs-from-traditional",
    },
    {
      id: "diff-threat-visibility",
      title: "Threat Visibility",
      level: 1,
      hideFromNav: true,
      navGroupId: "differs-from-traditional",
    },
    {
      id: "diff-soar",
      title: "SOAR & Automation",
      level: 1,
      hideFromNav: true,
      navGroupId: "differs-from-traditional",
    },
    {
      id: "diff-search",
      title: "Search & Investigation",
      level: 1,
      hideFromNav: true,
      navGroupId: "differs-from-traditional",
    },
  ],
  "tenant-activation": [
    {
      id: "tenant-activation",
      title: "Tenant Activation by Securonix",
      level: 0,
      suppressHeading: true,
      imageSrc: "/assets/images/courses/securonix_siem/tenant_activation_mail.png",
      imageAlt: "Tenant activation setup email from Securonix",
    },
    {
      id: "saas-endpoints-whitelist",
      title: "SaaS endpoints to whitelist",
      level: 0,
      suppressHeading: true,
      imageSrc: "/assets/images/courses/securonix_siem/urls_to_allow.png",
      imageAlt: "Securonix SaaS endpoints to whitelist",
    },
  ],
}

export function getTopicOutline(topicId: string): readonly SecuronixSiemOutlineItem[] {
  return SECURONIX_SIEM_OUTLINE[topicId] ?? []
}

export function getTopicNavSections(
  topicId: string
): readonly SecuronixSiemOutlineItem[] {
  return getTopicOutline(topicId).filter((s) => !s.hideFromNav)
}

/** Map scroll-active section id to the nav item that should appear highlighted. */
export function resolveNavActiveSectionId(
  activeSectionId: string,
  sections: readonly SecuronixSiemOutlineItem[]
): string {
  const active = sections.find((s) => s.id === activeSectionId)
  if (active?.hideFromNav && active.navGroupId) return active.navGroupId
  return activeSectionId
}

/** Lesson body copy keyed by topic id, then section id. */
export const SECURONIX_SIEM_SECTION_CONTENT: Record<string, Record<string, string>> = {
  overview: {
    introduction:
      "Securonix Unified Defense SIEM is a cloud-native Security Information and Event Management (SIEM) platform that combines SIEM, User and Entity Behavior Analytics (UEBA), SOAR, Threat Intelligence into a unified security operations platform.",
  },
  "tenant-activation": {
    "tenant-activation":
      "After onboarding, the Securonix team provisions the tenant and shares the setup details via email. The email typically contains the Tenant URL, Cloud Hub URL (if Cloud Hub is part of the deployment), Hub installation package download URL, and initial login credentials. The customer can then access the tenant and begin the implementation and log onboarding process.",
    "saas-endpoints-whitelist":
      "The onboarding email also includes the list of Securonix SaaS endpoints that must be whitelisted to allow communication between the customer environment (Cloud Hub/Hub) and the Securonix platform. These endpoints typically include the Securonix Console URL and Kafka broker URLs used for secure log transmission from the Hub to the Securonix SaaS platform.",
  },
}

export function getSectionContent(topicId: string, sectionId: string): string | undefined {
  return SECURONIX_SIEM_SECTION_CONTENT[topicId]?.[sectionId]
}

export const SECURONIX_SIEM_SECTION_COMPARISONS: Record<
  string,
  Record<string, SecuronixSectionComparison>
> = {
  overview: {
    "diff-architecture": {
      traditional: "On-premises, hardware-dependent, difficult to scale",
      securonix: "Cloud-native SaaS, elastic scaling, no infrastructure management",
    },
    "diff-detection": {
      traditional: "Rule-based correlation — only catches known threats",
      securonix: "ML + behavioral analytics (UEBA) — detects unknown and insider threats",
    },
    "diff-deployment": {
      traditional: "Long deployment cycles, heavy tuning, dedicated admin teams",
      securonix: "Faster deployment, continuous cloud updates, lower operational overhead",
    },
    "diff-threat-visibility": {
      traditional: "Siloed log aggregation, high false positive rates",
      securonix: "Risk-scored, behavior-based alerts with context — fewer, higher-fidelity alerts",
    },
    "diff-soar": {
      traditional: "Limited or bolt-on automation, manual response workflows",
      securonix: "Built-in SOAR capabilities with automated playbooks and case management",
    },
    "diff-search": {
      traditional: "Slow, complex query languages across large datasets",
      securonix: "Spotter search engine — fast, Google-like search across the data lake",
    },
  },
}

export function getSectionComparison(
  topicId: string,
  sectionId: string
): SecuronixSectionComparison | undefined {
  return SECURONIX_SIEM_SECTION_COMPARISONS[topicId]?.[sectionId]
}
