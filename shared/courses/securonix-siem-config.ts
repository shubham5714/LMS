import { HUB_INSTALLATION_STEPS } from "@/shared/courses/hub-installation-steps"

export const SECURONIX_SIEM_COURSE_ID = "securonix-siem" as const

export type SecuronixSiemTopic = {
  id: string
  title: string
  path: string
  /** If true, non-paid users see a full-topic access gate instead of lesson body */
  paidOnly?: boolean
}

export const SECURONIX_SIEM_TOPICS: readonly SecuronixSiemTopic[] = [
  {
    id: "overview",
    title: "Securonix SIEM Overview",
    path: "/courses/securonix-siem",
  },
  {
    id: "architecture",
    title: "Securonix Architecture",
    path: "/courses/securonix-siem/architecture",
  },
  {
    id: "tenant-activation",
    title: "Tenant Activation by Securonix",
    path: "/courses/securonix-siem/tenant-activation",
  },
  {
    id: "ui-tour",
    title: "Securonix UI Tour",
    path: "/courses/securonix-siem/ui-tour",
  },
  {
    id: "ai-agents",
    title: "Securonix AI Agents",
    path: "/courses/securonix-siem/ai-agents",
  },
  {
    id: "hub-installation",
    title: "Securonix Hub Installation",
    path: "/courses/securonix-siem/hub-installation",
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
  /** Storylane inline demo iframe src (loads after section intro text) */
  storylaneEmbedSrc?: string
}

export type SecuronixSectionComparison = {
  traditional: string
  securonix: string
}

export type SecuronixSectionTable = {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  footerNote?: string
}

export type InstallationStepBlock =
  | { type: "text"; content: string }
  | { type: "list"; items: readonly string[] }
  | { type: "code"; content: string }

export type InstallationStep = {
  id: string
  title: string
  blocks: readonly InstallationStepBlock[]
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
  architecture: [
    {
      id: "architecture-diagram",
      title: "Architecture Diagram",
      level: 0,
      suppressHeading: true,
      imageSrc: "/assets/images/courses/securonix_siem/securonix_architecture.png",
      imageAlt: "Securonix SIEM architecture diagram",
    },
    { id: "data-sources", title: "1. Data Sources", level: 0 },
    {
      id: "securonix-hub",
      title: "2. Securonix HUB (Collection & Forwarding)",
      level: 0,
    },
    {
      id: "application-components",
      title: "3. Securonix Application Components (Processing & Analytics)",
      level: 0,
    },
    { id: "storage-consumption", title: "4. Storage & Consumption", level: 0 },
  ],
  "ui-tour": [
    {
      id: "ui-tour-demo",
      title: "Interactive demo",
      level: 0,
      suppressHeading: true,
      storylaneEmbedSrc: "https://app.storylane.io/demo/jxz6ggkckcfx?embed=inline",
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
  "ai-agents": [
    { id: "introduction", title: "Introduction", level: 0 },
    { id: "response-agent", title: "Response Agent", level: 0 },
    { id: "insider-intent-agent", title: "Insider Intent Agent", level: 0 },
    { id: "noise-control-agent", title: "Noise Control Agent", level: 0 },
    { id: "search-agent", title: "Search Agent", level: 0 },
    { id: "investigate-agent", title: "Investigate Agent", level: 0 },
    { id: "data-pipeline-agent", title: "Data Pipeline Agent", level: 0 },
  ],
  "hub-installation": [
    { id: "hub-prerequisites", title: "Securonix Hub Prerequisites", level: 0 },
    { id: "recommended-server-sizing", title: "Recommended Server Sizing", level: 0 },
    { id: "supported-operating-systems", title: "Supported Operating Systems", level: 0 },
    { id: "installation-steps", title: "Securonix Hub Installation Steps", level: 0 },
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
  architecture: {
    "data-sources":
      "The platform ingests data from three main streams via Push or Pull mechanisms:\n\n- On-Premises & Enterprise: Enterprise Systems, Applications, Networks, and Endpoints.\n- Cloud: Cloud IAAS, PAAS, and SAAS Logs.\n- Contextual Data: Threat Intelligence and Geolocation Data.",
    "securonix-hub":
      "Acts as the initial entry point for data collection:\n\n- Data is gathered by Data Collectors and Fluentbit Forwarders, then temporarily stored in Local Files.\n- It supports forwarding logs to a Third-Party Syslog Server.\n- An Ingestor Service then moves the data out of the HUB and into the core application components.",
    "application-components":
      "This is the central engine where data is real-time processed and analyzed:\n\n- Kafka: Serves as the message streaming backbone to ingest data smoothly.\n- Parsing, Normalization, and Enrichment: Raw logs are structured and injected with context (like threat intel).\n- Data Pipeline Manager: Manages basic and analytical data pipelines.\n- Streaming Analytics & SOAR: Data undergoes real-time behavior analytics. If threats are detected, it hooks directly into a Built-in SOAR (Security Orchestration, Automation, and Response) system for automated remediation.",
    "storage-consumption":
      "Snowflake Data Cloud: Processed analytics and logs are stored in Snowflake, which acts as the centralized data lake.\n\nEnd-User Capabilities: Security teams interact with the data stored in Snowflake through four main interfaces:\n\n- Spotter Search (for threat hunting)\n- Dashboards\n- Reports\n- AI Agents",
  },
  "ui-tour": {
    "ui-tour-demo":
      "Explore the Securonix Unified Defense console through this interactive walkthrough. Use the demo below to navigate key areas of the UI for threat detection, investigation, and response.",
  },
  "tenant-activation": {
    "tenant-activation":
      "After onboarding, the Securonix team provisions the tenant and shares the setup details via email. The email typically contains the Tenant URL, Cloud Hub URL (if Cloud Hub is part of the deployment), Hub installation package download URL, and initial login credentials. The customer can then access the tenant and begin the implementation and log onboarding process.",
    "saas-endpoints-whitelist":
      "The onboarding email also includes the list of Securonix SaaS endpoints that must be whitelisted to allow communication between the customer environment (Cloud Hub/Hub) and the Securonix platform. These endpoints typically include the Securonix Console URL and Kafka broker URLs used for secure log transmission from the Hub to the Securonix SaaS platform.",
  },
  "ai-agents": {
    introduction:
      "Securonix AI Agents are purpose-built autonomous assistants embedded within the Securonix SIEM platform to help security teams detect, investigate, and respond to threats more efficiently.",
    "response-agent":
      "Automatically takes approved response actions through SOAR workflows, such as disabling accounts, blocking IPs, or isolating endpoints. It speeds up incident containment while ensuring actions stay within predefined governance policies.\n\nOutcome: Faster response and reduced MTTR.",
    "insider-intent-agent":
      "Detects potential insider threats by analyzing user behavior changes, psycholinguistic patterns, access activity, and risk indicators. It focuses on identifying suspicious intent before actual damage occurs.\n\nOutcome: Early insider threat detection with minimal alert noise.",
    "noise-control-agent":
      "Reduces false positives by identifying repetitive, low-value, and non-actionable alerts using AI reasoning, behavioral context, and analyst feedback.\n\nOutcome: Less alert fatigue and more focus on genuine threats.",
    "search-agent":
      "Allows analysts to use natural language queries instead of complex SIEM search syntax. The agent translates the request into optimized searches across security data.\n\nOutcome: Faster and easier threat hunting.",
    "investigate-agent":
      "Collects and correlates telemetry, alerts, user activity, asset context, and threat intelligence to create a unified investigation narrative.\n\nOutcome: Faster investigations and better incident understanding.",
    "data-pipeline-agent":
      "Optimizes how telemetry is ingested, stored, and routed by prioritizing high-value security data and reducing unnecessary data processing.\n\nOutcome: Lower SIEM costs while maintaining security visibility.",
  },
  "hub-installation": {
    "hub-prerequisites":
      "Before installing Securonix Hub, ensure the following requirements are met:\n\n- Server: Physical or virtual Linux server.\n- SIEM Version: Unified Defense SIEM version 6.4 August 2024 R1 or later.\n- User Permissions: A non-root user with sudo privileges is required for installation.\n- Hostname: Each Hub instance must have a unique hostname to avoid data routing and ingestion issues.\n- SELinux: Must be set to Permissive mode.\n- Network Utility: tcptraceroute must be installed.\n- Storage:\n  - At least 10 GB free space in the temporary directory.\n  - A separate /Securonix mount point with write permissions and sufficient storage.\n- Firewall Ports:\n  - 514/TCP (Inbound) for Syslog sources.\n  - 9092 or 9093 (Outbound) for Kafka communication.\n  - 443 (Outbound) for SNYPR Console access.\n- Data Retention: Minimum 4 days of data retention on the Hub.",
    "supported-operating-systems":
      "- Ubuntu 22.04 LTS\n- Rocky Linux 9.x\n- RHEL 8.x and 9.x\n- Oracle Linux 8.x\n- Amazon Linux 2 and 2023\n\nUbuntu 20.04, RHEL 7.x, and CentOS 7/8 are deprecated and not recommended for new deployments.",
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

export const SECURONIX_SIEM_SECTION_TABLES: Record<
  string,
  Record<string, SecuronixSectionTable>
> = {
  "hub-installation": {
    "recommended-server-sizing": {
      headers: ["EPS Range", "CPU", "Memory", "Storage"],
      rows: [
        ["Up to 8K EPS", "2 Cores", "4 GB", "160 GB"],
        ["Up to 15K EPS", "4 Cores", "16 GB", "820 GB"],
        ["Up to 25K EPS", "8 Cores", "32 GB", "1.6 TB"],
        ["Up to 50K EPS", "16 Cores", "64 GB", "5 TB"],
      ],
      footerNote:
        "For high-volume environments, a 10 Gbps or higher NIC is recommended.",
    },
  },
}

export function getSectionTable(
  topicId: string,
  sectionId: string
): SecuronixSectionTable | undefined {
  return SECURONIX_SIEM_SECTION_TABLES[topicId]?.[sectionId]
}

export function getInstallationSteps(
  topicId: string,
  sectionId: string
): readonly InstallationStep[] | undefined {
  if (topicId === "hub-installation" && sectionId === "installation-steps") {
    return HUB_INSTALLATION_STEPS
  }
  return undefined
}
