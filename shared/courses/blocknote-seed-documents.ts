/**
 * Initial BlockNote documents for course topics.
 * Used when DB has no row yet (first load / before migration seed runs).
 */

import { HUB_INSTALLATION_STEPS } from "@/shared/courses/hub-installation-steps"

export type SeedInline =
  | string
  | { type: "text"; text: string; styles?: Record<string, boolean> }

export type SeedBlock = {
  id?: string
  type: string
  props?: Record<string, unknown>
  content?: SeedInline[] | string | unknown
  children?: SeedBlock[]
}

function para(text: string, id?: string): SeedBlock {
  return {
    id,
    type: "paragraph",
    content: [{ type: "text", text, styles: {} }],
  }
}

function heading(text: string, level: 2 | 3, id?: string): SeedBlock {
  return {
    id,
    type: "heading",
    props: { level },
    content: [{ type: "text", text, styles: {} }],
  }
}

function bullet(text: string): SeedBlock {
  return {
    type: "bulletListItem",
    content: [{ type: "text", text, styles: {} }],
  }
}

function code(text: string): SeedBlock {
  return {
    type: "codeBlock",
    props: { language: "bash" },
    content: text,
  }
}

function image(url: string, caption = ""): SeedBlock {
  return {
    type: "image",
    props: {
      url,
      caption,
      name: caption || "image",
      showPreview: true,
    },
  }
}

/** Split markdown-ish section body into paragraphs / bullets. */
function bodyFromMarkdown(md: string): SeedBlock[] {
  const blocks: SeedBlock[] = []
  const lines = md.split("\n")
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i += 1
      continue
    }
    if (line.trim().startsWith("- ")) {
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        blocks.push(bullet(lines[i].trim().slice(2)))
        i += 1
      }
      continue
    }
    const paraLines: string[] = [line]
    i += 1
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("- ")
    ) {
      paraLines.push(lines[i])
      i += 1
    }
    blocks.push(para(paraLines.join(" ").trim()))
  }
  return blocks
}

function comparison(traditional: string, securonix: string): SeedBlock[] {
  return [
    para(`Traditional SIEM: ${traditional}`),
    para(`Securonix: ${securonix}`),
  ]
}

const SECURONIX_OVERVIEW: SeedBlock[] = [
  heading("Introduction", 2, "introduction"),
  para(
    "Securonix Unified Defense SIEM is a cloud-native Security Information and Event Management (SIEM) platform that combines SIEM, User and Entity Behavior Analytics (UEBA), SOAR, Threat Intelligence into a unified security operations platform."
  ),
  heading("Market Positioning", 2, "market-positioning"),
  image(
    "/assets/images/courses/securonix_siem/securonix_gartner.png",
    "Gartner Magic Quadrant — Securonix"
  ),
  heading("How it differs from traditional SIEMs", 2, "differs-from-traditional"),
  heading("Architecture", 3, "diff-architecture"),
  ...comparison(
    "On-premises, hardware-dependent, difficult to scale",
    "Cloud-native SaaS, elastic scaling, no infrastructure management"
  ),
  heading("Detection Approach", 3, "diff-detection"),
  ...comparison(
    "Rule-based correlation — only catches known threats",
    "ML + behavioral analytics (UEBA) — detects unknown and insider threats"
  ),
  heading("Deployment & Maintenance", 3, "diff-deployment"),
  ...comparison(
    "Long deployment cycles, heavy tuning, dedicated admin teams",
    "Faster deployment, continuous cloud updates, lower operational overhead"
  ),
  heading("Threat Visibility", 3, "diff-threat-visibility"),
  ...comparison(
    "Siloed log aggregation, high false positive rates",
    "Risk-scored, behavior-based alerts with context — fewer, higher-fidelity alerts"
  ),
  heading("SOAR & Automation", 3, "diff-soar"),
  ...comparison(
    "Limited or bolt-on automation, manual response workflows",
    "Built-in SOAR capabilities with automated playbooks and case management"
  ),
  heading("Search & Investigation", 3, "diff-search"),
  ...comparison(
    "Slow, complex query languages across large datasets",
    "Spotter search engine — fast, Google-like search across the data lake"
  ),
]

const SECURONIX_ARCHITECTURE: SeedBlock[] = [
  image(
    "/assets/images/courses/securonix_siem/securonix_architecture.png",
    "Securonix SIEM architecture diagram"
  ),
  heading("1. Data Sources", 2, "data-sources"),
  ...bodyFromMarkdown(
    "The platform ingests data from three main streams via Push or Pull mechanisms:\n\n- On-Premises & Enterprise: Enterprise Systems, Applications, Networks, and Endpoints.\n- Cloud: Cloud IAAS, PAAS, and SAAS Logs.\n- Contextual Data: Threat Intelligence and Geolocation Data."
  ),
  heading("2. Securonix HUB (Collection & Forwarding)", 2, "securonix-hub"),
  ...bodyFromMarkdown(
    "Acts as the initial entry point for data collection:\n\n- Data is gathered by Data Collectors and Fluentbit Forwarders, then temporarily stored in Local Files.\n- It supports forwarding logs to a Third-Party Syslog Server.\n- An Ingestor Service then moves the data out of the HUB and into the core application components."
  ),
  heading(
    "3. Securonix Application Components (Processing & Analytics)",
    2,
    "application-components"
  ),
  ...bodyFromMarkdown(
    "This is the central engine where data is real-time processed and analyzed:\n\n- Kafka: Serves as the message streaming backbone to ingest data smoothly.\n- Parsing, Normalization, and Enrichment: Raw logs are structured and injected with context (like threat intel).\n- Data Pipeline Manager: Manages basic and analytical data pipelines.\n- Streaming Analytics & SOAR: Data undergoes real-time behavior analytics. If threats are detected, it hooks directly into a Built-in SOAR (Security Orchestration, Automation, and Response) system for automated remediation."
  ),
  heading("4. Storage & Consumption", 2, "storage-consumption"),
  ...bodyFromMarkdown(
    "Snowflake Data Cloud: Processed analytics and logs are stored in Snowflake, which acts as the centralized data lake.\n\nEnd-User Capabilities: Security teams interact with the data stored in Snowflake through four main interfaces:\n\n- Spotter Search (for threat hunting)\n- Dashboards\n- Reports\n- AI Agents"
  ),
]

const SECURONIX_UI_TOUR: SeedBlock[] = [
  ...bodyFromMarkdown(
    "Explore the Securonix Unified Defense console through this interactive walkthrough. Use the demo below to navigate key areas of the UI for threat detection, investigation, and response."
  ),
  {
    id: "ui-tour-demo",
    type: "storylaneEmbed",
    props: {
      demoUrl: "https://app.storylane.io/demo/jxz6ggkckcfx?embed=inline",
      title: "Securonix UI Tour — interactive demo",
    },
  },
]

const SECURONIX_TENANT: SeedBlock[] = [
  ...bodyFromMarkdown(
    "After onboarding, the Securonix team provisions the tenant and shares the setup details via email. The email typically contains the Tenant URL, Cloud Hub URL (if Cloud Hub is part of the deployment), Hub installation package download URL, and initial login credentials. The customer can then access the tenant and begin the implementation and log onboarding process."
  ),
  image(
    "/assets/images/courses/securonix_siem/tenant_activation_mail.png",
    "Tenant activation setup email from Securonix"
  ),
  heading("SaaS endpoints to whitelist", 2, "saas-endpoints-whitelist"),
  ...bodyFromMarkdown(
    "The onboarding email also includes the list of Securonix SaaS endpoints that must be whitelisted to allow communication between the customer environment (Cloud Hub/Hub) and the Securonix platform. These endpoints typically include the Securonix Console URL and Kafka broker URLs used for secure log transmission from the Hub to the Securonix SaaS platform."
  ),
  image(
    "/assets/images/courses/securonix_siem/urls_to_allow.png",
    "Securonix SaaS endpoints to whitelist"
  ),
]

const SECURONIX_AI: SeedBlock[] = [
  heading("Introduction", 2, "introduction"),
  para(
    "Securonix AI Agents are purpose-built autonomous assistants embedded within the Securonix SIEM platform to help security teams detect, investigate, and respond to threats more efficiently."
  ),
  heading("Response Agent", 2, "response-agent"),
  ...bodyFromMarkdown(
    "Automatically takes approved response actions through SOAR workflows, such as disabling accounts, blocking IPs, or isolating endpoints. It speeds up incident containment while ensuring actions stay within predefined governance policies.\n\nOutcome: Faster response and reduced MTTR."
  ),
  heading("Insider Intent Agent", 2, "insider-intent-agent"),
  ...bodyFromMarkdown(
    "Detects potential insider threats by analyzing user behavior changes, psycholinguistic patterns, access activity, and risk indicators. It focuses on identifying suspicious intent before actual damage occurs.\n\nOutcome: Early insider threat detection with minimal alert noise."
  ),
  heading("Noise Control Agent", 2, "noise-control-agent"),
  ...bodyFromMarkdown(
    "Reduces false positives by identifying repetitive, low-value, and non-actionable alerts using AI reasoning, behavioral context, and analyst feedback.\n\nOutcome: Less alert fatigue and more focus on genuine threats."
  ),
  heading("Search Agent", 2, "search-agent"),
  ...bodyFromMarkdown(
    "Allows analysts to use natural language queries instead of complex SIEM search syntax. The agent translates the request into optimized searches across security data.\n\nOutcome: Faster and easier threat hunting."
  ),
  heading("Investigate Agent", 2, "investigate-agent"),
  ...bodyFromMarkdown(
    "Collects and correlates telemetry, alerts, user activity, asset context, and threat intelligence to create a unified investigation narrative.\n\nOutcome: Faster investigations and better incident understanding."
  ),
  heading("Data Pipeline Agent", 2, "data-pipeline-agent"),
  ...bodyFromMarkdown(
    "Optimizes how telemetry is ingested, stored, and routed by prioritizing high-value security data and reducing unnecessary data processing.\n\nOutcome: Lower SIEM costs while maintaining security visibility."
  ),
]

function hubInstallStepsBlocks(): SeedBlock[] {
  const out: SeedBlock[] = []
  for (const step of HUB_INSTALLATION_STEPS) {
    out.push(heading(step.title, 3, step.id))
    for (const b of step.blocks) {
      if (b.type === "text") out.push(para(b.content))
      else if (b.type === "list") {
        for (const item of b.items) out.push(bullet(item))
      } else if (b.type === "code") out.push(code(b.content))
    }
  }
  return out
}

const SECURONIX_HUB: SeedBlock[] = [
  heading("Securonix Hub Prerequisites", 2, "hub-prerequisites"),
  ...bodyFromMarkdown(
    "Before installing Securonix Hub, ensure the following requirements are met:\n\n- Server: Physical or virtual Linux server.\n- SIEM Version: Unified Defense SIEM version 6.4 August 2024 R1 or later.\n- User Permissions: A non-root user with sudo privileges is required for installation.\n- Hostname: Each Hub instance must have a unique hostname to avoid data routing and ingestion issues.\n- SELinux: Must be set to Permissive mode.\n- Network Utility: tcptraceroute must be installed.\n- Storage:\n  - At least 10 GB free space in the temporary directory.\n  - A separate /Securonix mount point with write permissions and sufficient storage.\n- Firewall Ports:\n  - 514/TCP (Inbound) for Syslog sources.\n  - 9092 or 9093 (Outbound) for Kafka communication.\n  - 443 (Outbound) for SNYPR Console access.\n- Data Retention: Minimum 4 days of data retention on the Hub."
  ),
  heading("Recommended Server Sizing", 2, "recommended-server-sizing"),
  para("EPS Range | CPU | Memory | Storage"),
  bullet("Up to 8K EPS — 2 Cores, 4 GB, 160 GB"),
  bullet("Up to 15K EPS — 4 Cores, 16 GB, 820 GB"),
  bullet("Up to 25K EPS — 8 Cores, 32 GB, 1.6 TB"),
  bullet("Up to 50K EPS — 16 Cores, 64 GB, 5 TB"),
  para("For high-volume environments, a 10 Gbps or higher NIC is recommended."),
  heading("Supported Operating Systems", 2, "supported-operating-systems"),
  ...bodyFromMarkdown(
    "- Ubuntu 22.04 LTS\n- Rocky Linux 9.x\n- RHEL 8.x and 9.x\n- Oracle Linux 8.x\n- Amazon Linux 2 and 2023\n\nUbuntu 20.04, RHEL 7.x, and CentOS 7/8 are deprecated and not recommended for new deployments."
  ),
  heading("Securonix Hub Installation Steps", 2, "installation-steps"),
  ...hubInstallStepsBlocks(),
]

function emptyStarter(topicTitle: string): SeedBlock[] {
  return [
    heading(topicTitle, 2),
    para("Start writing this lesson. Use / for headings, lists, images, Premium section, or Storylane embed."),
  ]
}

export const BLOCKNOTE_SEED_DOCUMENTS: Record<
  string,
  Record<string, SeedBlock[]>
> = {
  "securonix-siem": {
    overview: SECURONIX_OVERVIEW,
    architecture: SECURONIX_ARCHITECTURE,
    "tenant-activation": SECURONIX_TENANT,
    "ui-tour": SECURONIX_UI_TOUR,
    "ai-agents": SECURONIX_AI,
    "hub-installation": SECURONIX_HUB,
  },
  "soc-fundamentals": {
    overview: emptyStarter("Overview"),
    "soc-roles": emptyStarter("SOC Roles & Responsibilities"),
    "threat-lifecycle": emptyStarter("Threat Lifecycle"),
    "incident-triage": [
      heading("Introduction", 2, "triage-intro"),
      para("Placeholder content for Incident Triage. Replace with your lesson material."),
      heading("Alert volume & noise", 2, "alert-flood"),
      para("Placeholder content for alert volume and noise."),
      {
        id: "architecture-diagram",
        type: "premiumStart",
        props: {
          title: "Architecture diagram",
          previewSrc: "/assets/images/courses/soc_fundamental/content.png",
        },
      },
      heading("Architecture diagram", 2),
      image(
        "/assets/images/courses/soc_fundamental/content.png",
        "Architecture diagram"
      ),
      para("Premium diagram and notes for paid members."),
      { type: "premiumEnd" },
      heading("Prioritization frameworks", 2, "prioritization"),
      para("Placeholder content for prioritization frameworks."),
    ],
    "siem-fundamentals": emptyStarter("SIEM Fundamentals"),
    "log-analysis": emptyStarter("Log Analysis Basics"),
  },
}

export function getSeedBlocks(
  courseId: string,
  topicId: string
): SeedBlock[] {
  return (
    BLOCKNOTE_SEED_DOCUMENTS[courseId]?.[topicId] ?? [
      para("No content yet. Admins can edit and save this lesson."),
    ]
  )
}
