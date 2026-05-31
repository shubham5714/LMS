export const SOC_FUNDAMENTALS_COURSE_ID = "soc-fundamentals" as const

export type SocFundamentalsTopic = {
  id: string
  title: string
  path: string
}

export const SOC_FUNDAMENTALS_TOPICS: readonly SocFundamentalsTopic[] = [
  { id: "overview", title: "Overview", path: "/courses/soc-fundamentals" },
  {
    id: "soc-roles",
    title: "SOC Roles & Responsibilities",
    path: "/courses/soc-fundamentals/soc-roles",
  },
  {
    id: "threat-lifecycle",
    title: "Threat Lifecycle",
    path: "/courses/soc-fundamentals/threat-lifecycle",
  },
  {
    id: "incident-triage",
    title: "Incident Triage",
    path: "/courses/soc-fundamentals/incident-triage",
  },
  {
    id: "siem-fundamentals",
    title: "SIEM Fundamentals",
    path: "/courses/soc-fundamentals/siem-fundamentals",
  },
  {
    id: "log-analysis",
    title: "Log Analysis Basics",
    path: "/courses/soc-fundamentals/log-analysis",
  },
] as const

/** URL prefix for all SOC Fundamentals lesson routes */
export const SOC_FUNDAMENTALS_ROUTE_PREFIX = "/courses/soc-fundamentals" as const

/** Shown in the app header and course chrome */
export const SOC_FUNDAMENTALS_DISPLAY_NAME = "SOC Fundamentals"

/** Resolve which topic matches the current URL (longest path wins). */
export function getSocFundamentalsTopicForPathname(
  pathname: string
): SocFundamentalsTopic | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/"
  const longestFirst = [...SOC_FUNDAMENTALS_TOPICS].sort((a, b) => b.path.length - a.path.length)
  return longestFirst.find((t) => normalized === t.path || normalized.startsWith(`${t.path}/`))
}

export const SOC_COURSE_PROGRESS_UPDATED_EVENT = "soc-fundamentals-course-progress-updated" as const

export type SocFundamentalsOutlineItem = {
  id: string
  title: string
  /** 0 = main heading, 1 = nested under previous main */
  level: 0 | 1
  /** If true, FREE members see a premium overlay instead of body content */
  paidOnly?: boolean
  /** Preview image behind overlay (path under /public, e.g. /assets/...) */
  premiumPreviewSrc?: string
}

/** True when user should see full course content (anything other than FREE). */
export function hasPaidMembership(membership: string | null | undefined): boolean {
  if (membership == null || membership === "") return false
  return membership.trim().toUpperCase() !== "FREE"
}

/** In-page sections for the “On this page” rail (per topic). */
export const SOC_FUNDAMENTALS_OUTLINE: Record<
  string,
  readonly SocFundamentalsOutlineItem[]
> = {
  overview: [
    { id: "introduction", title: "Introduction", level: 0 },
    { id: "what-is-soc", title: "What is a SOC?", level: 0 },
    { id: "soc-mission", title: "Mission & scope", level: 1 },
    { id: "why-soc-exists", title: "Why security operations matter", level: 1 },
    { id: "soc-lifecycle", title: "The SOC operating lifecycle", level: 1 },
    { id: "soc-vs-it", title: "SOC vs. IT operations", level: 1 },
    { id: "real-world", title: "Real-world examples", level: 0 },
    { id: "example-enterprise", title: "Enterprise monitoring", level: 1 },
    { id: "example-cloud", title: "Cloud & hybrid environments", level: 1 },
    { id: "misconceptions", title: "Common misconceptions", level: 0 },
  ],
  "soc-roles": [
    { id: "roles-intro", title: "Introduction", level: 0 },
    { id: "tier-model", title: "Tiered analyst model", level: 0 },
    { id: "tier1", title: "Tier 1 — Triage", level: 1 },
    { id: "tier2", title: "Tier 2 — Investigation", level: 1 },
    { id: "tier3", title: "Tier 3 — Advanced threats", level: 1 },
    { id: "soc-manager", title: "SOC manager & lead", level: 0 },
    { id: "cross-team", title: "Working with IR & IT", level: 0 },
  ],
  "threat-lifecycle": [
    { id: "tl-intro", title: "Introduction", level: 0 },
    { id: "kill-chain", title: "Attack lifecycle models", level: 0 },
    { id: "recon", title: "Reconnaissance & delivery", level: 1 },
    { id: "exploit", title: "Exploitation & persistence", level: 1 },
    { id: "detection-points", title: "Where detection fits", level: 0 },
    { id: "mitre", title: "MITRE ATT&CK overview", level: 1 },
  ],
  "incident-triage": [
    { id: "triage-intro", title: "Introduction", level: 0 },
    { id: "alert-flood", title: "Alert volume & noise", level: 0 },
    {
      id: "architecture-diagram",
      title: "Architecture diagram",
      level: 0,
      paidOnly: true,
      premiumPreviewSrc: "/assets/images/courses/soc_fundamental/content.png",
    },
    { id: "prioritization", title: "Prioritization frameworks", level: 0 },
    { id: "severity", title: "Severity vs. priority", level: 1 },
    { id: "playbooks", title: "Triage playbooks", level: 0 },
    { id: "escalation", title: "When to escalate", level: 0 },
  ],
  "siem-fundamentals": [
    { id: "siem-intro", title: "Introduction", level: 0 },
    { id: "what-siem", title: "What a SIEM does", level: 0 },
    { id: "collection", title: "Log collection & parsing", level: 1 },
    { id: "correlation", title: "Correlation rules", level: 1 },
    { id: "use-cases", title: "Detection use cases", level: 0 },
    { id: "limitations", title: "Limitations & tuning", level: 0 },
  ],
  "log-analysis": [
    { id: "logs-intro", title: "Introduction", level: 0 },
    { id: "log-types", title: "Common log types", level: 0 },
    { id: "windows", title: "Windows event logs", level: 1 },
    { id: "network", title: "Network & firewall logs", level: 1 },
    { id: "timelines", title: "Building timelines", level: 0 },
    { id: "pivoting", title: "Pivoting on IOCs", level: 0 },
  ],
}

export function getTopicOutline(topicId: string): readonly SocFundamentalsOutlineItem[] {
  return SOC_FUNDAMENTALS_OUTLINE[topicId] ?? []
}
