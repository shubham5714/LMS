export type LandingCatalogTab = "tracks" | "courses" | "skills"

export const LANDING_PATH_TABS: { id: LandingCatalogTab; label: string }[] = [
  { id: "tracks", label: "Career Tracks" },
  { id: "courses", label: "Courses" },
  { id: "skills", label: "Skill Tracks" },
]

export const LANDING_CAREER_TRACKS = [
  {
    title: "SOC Analyst",
    level: "Beginner → Intermediate",
    href: "/learning-paths",
    description:
      "Zero to job-ready SOC analyst — roles, threat lifecycle, triage, SIEM fundamentals, and log analysis, with hands-on labs after every stage.",
    meta: "4.9 · 12+ hours · 2 courses · guided path",
    icon: "ri-shield-user-line",
  },
  {
    title: "SIEM Practitioner",
    level: "Intermediate",
    href: "/courses/securonix-siem",
    description:
      "Operate Securonix in production — architecture, tenant activation, UI workflows, AI agents, and Hub installation.",
    meta: "4.8 · 9 hours · 6 modules · labs",
    icon: "ri-radar-line",
  },
  {
    title: "Detection Engineer",
    level: "Intermediate → Advanced",
    href: "/courses",
    description:
      "Build detection use cases, tune alert quality, and validate investigations across SIEM and security telemetry.",
    meta: "4.8 · skill-focused · scenarios",
    icon: "ri-bug-line",
  },
] as const

export const LANDING_COURSE_CARDS = [
  {
    title: "SOC Fundamentals",
    level: "Beginner",
    href: "/courses/soc-fundamentals",
    description:
      "Core security operations concepts: roles, threat lifecycle, triage, SIEM basics, and log analysis.",
    meta: "6 hrs · 6 modules · 28 lessons",
    icon: "ri-graduation-cap-line",
  },
  {
    title: "Securonix SIEM",
    level: "Intermediate",
    href: "/courses/securonix-siem",
    description:
      "Platform architecture, tenant activation, UI tour, AI agents, and Hub installation.",
    meta: "9 hrs · 6 modules · 42 lessons",
    icon: "ri-radar-line",
  },
  {
    title: "Incident Triage Lab",
    level: "Beginner",
    href: "/courses/soc-fundamentals/incident-triage",
    description:
      "Practice real alert workflows — prioritize, investigate, and document like a day-one analyst.",
    meta: "hands-on · SOC workflows",
    icon: "ri-alarm-warning-line",
  },
] as const

export const LANDING_SKILL_TRACKS = [
  {
    title: "SIEM Fundamentals",
    level: "Beginner → Intermediate",
    href: "/courses/soc-fundamentals/siem-fundamentals",
    description: "Query, correlate, and operationalize SIEM alerts with confidence.",
    meta: "skill track · detection basics",
    icon: "ri-database-2-line",
  },
  {
    title: "Log Analysis",
    level: "Beginner",
    href: "/courses/soc-fundamentals/log-analysis",
    description: "Read telemetry, spot anomalies, and turn raw logs into investigation leads.",
    meta: "skill track · evidence first",
    icon: "ri-file-search-line",
  },
  {
    title: "Threat Lifecycle",
    level: "Beginner",
    href: "/courses/soc-fundamentals/threat-lifecycle",
    description: "Map attacker behavior from initial access through impact and recovery.",
    meta: "skill track · kill chain",
    icon: "ri-flow-chart",
  },
] as const

export const LANDING_TOOLS = [
  { name: "Microsoft Sentinel", src: "/assets/images/brand-logos/landing-sentinel.png" },
  { name: "Elastic", src: "/assets/images/brand-logos/landing-elastic.png" },
  { name: "Palo Alto", src: "/assets/images/brand-logos/landing-paloalto.png" },
  { name: "CrowdStrike", src: "/assets/images/brand-logos/landing-crowdstrike.png" },
  { name: "Trend Micro", src: "/assets/images/brand-logos/landing-trendmicro.png" },
  { name: "QRadar", src: "/assets/images/brand-logos/landing-qradar.png" },
  { name: "Splunk", src: "/assets/images/brand-logos/landing-splunk.png" },
  { name: "Zscaler", src: "/assets/images/brand-logos/landing-zscaler.png" },
] as const

export const LANDING_HOW_STEPS = [
  {
    id: "01",
    title: "Learn in the right order",
    summary: "A guided path from foundations to advanced SOC skills.",
    detail:
      "Choose your goal and get a clear path that tells you exactly what to learn next — without jumping into advanced topics too early.",
  },
  {
    id: "02",
    title: "Validate every skill",
    summary: "Assessments and quizzes reveal what you truly know.",
    detail:
      "Checkpoints after each module confirm you can triage, query, and explain decisions — not just watch videos.",
  },
  {
    id: "03",
    title: "Prove you can apply it",
    summary: "Turn knowledge into practical, verifiable skill.",
    detail:
      "Hands-on labs and investigation scenarios mirror the alerts and workflows you will see on the job.",
  },
  {
    id: "04",
    title: "Get interview-ready",
    summary: "Prepare, practice, and close the final gaps.",
    detail:
      "Use structured paths, resources, and community practice to walk into interviews with real SOC confidence.",
  },
] as const

export const LANDING_FEATURES = [
  {
    title: "Guided Courses",
    description: "Structured lessons on SOC fundamentals, SIEM platforms, and analyst workflows.",
    icon: "ri-play-circle-line",
  },
  {
    title: "Learning Paths",
    description: "Role-based tracks that sequence the right courses from beginner to job-ready.",
    icon: "ri-route-line",
  },
  {
    title: "Hands-on Labs",
    description: "Practice triage, log analysis, and SIEM operations in realistic scenarios.",
    icon: "ri-terminal-box-line",
  },
  {
    title: "SIEM Playbooks",
    description: "Repeatable investigation patterns for alerts you will actually see in a SOC.",
    icon: "ri-book-open-line",
  },
  {
    title: "Progress Tracking",
    description: "Know exactly where you left off and what to tackle next on your path.",
    icon: "ri-bar-chart-box-line",
  },
  {
    title: "Community Support",
    description: "Learn alongside analysts sharing notes, tips, and investigation approaches.",
    icon: "ri-group-line",
  },
] as const

export const LANDING_TESTIMONIALS = [
  {
    quote:
      "The SOC Fundamentals path finally made triage click for me. Clear order, practical labs, and explanations that feel like real shift work.",
    name: "Aisha K.",
    role: "Junior SOC Analyst",
    company: "FinServ SOC",
  },
  {
    quote:
      "I switched from helpdesk into security ops using the SIEM track. The Securonix modules matched what we use at work almost one-to-one.",
    name: "Marcus T.",
    role: "SOC Analyst L1",
    company: "Managed Detection",
  },
  {
    quote:
      "Best part is the learning order. I stopped hopping between random YouTube videos and actually built a repeatable investigation process.",
    name: "Priya S.",
    role: "Detection Engineer",
    company: "Cloud Security Team",
  },
] as const

export const LANDING_PRICING_FEATURES = [
  "Career tracks for SOC and SIEM roles",
  "All courses — fundamentals through platform labs",
  "Skill assessments and guided learning paths",
  "Hands-on investigation and SIEM labs",
  "Resources, playbooks, and community access",
  "Progress tracking and future course updates",
] as const

export const LANDING_PLANS = [
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "₹999",
    cadence: "/month",
    note: "Billed monthly · cancel anytime",
    description: "Everything unlocked, billed month to month. Start today and pay as you go.",
    cta: "Start monthly",
    href: "/pages/pricing/",
    popular: false,
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "₹7999",
    cadence: "/year",
    note: "Best value · billed once a year",
    description: "One plan for the year — less than a coffee a day to change your SOC career.",
    cta: "Get instant access",
    href: "/pages/pricing/",
    popular: true,
  },
] as const

export const LANDING_FAQ_CATEGORIES = [
  { id: "started", label: "Getting Started", count: 5 },
  { id: "content", label: "Courses & Content", count: 4 },
  { id: "practice", label: "Practice & Hands-on", count: 4 },
  { id: "pricing", label: "Subscription & Pricing", count: 3 },
] as const

export const LANDING_FAQS: Record<string, { q: string; a: string }[]> = {
  started: [
    {
      q: "What is Cyber Docs?",
      a: "Cyber Docs is a guided learning platform for security operations careers. One place for courses, learning paths, labs, and resources to go from beginner to job-ready SOC analyst.",
    },
    {
      q: "Who is this for?",
      a: "Anyone aiming to become a SOC analyst, detection engineer, incident responder, or DFIR analyst — or upskilling on SIEM tools like Securonix, Splunk, and Sentinel.",
    },
    {
      q: "Do I need any prerequisites?",
      a: "No. SOC Fundamentals starts from the basics. If you already know networking or security concepts, jump into SIEM or triage modules at your level.",
    },
    {
      q: "Is it free to start?",
      a: "Yes. Explore courses and learning paths to get oriented. Premium unlocks the full catalog, labs, and advanced practice.",
    },
    {
      q: "How is this different from YouTube?",
      a: "Free tutorials teach concepts in isolation. Cyber Docs gives you a structured path, progress tracking, hands-on labs, and role-based tracks connected in one platform.",
    },
  ],
  content: [
    {
      q: "What courses are included?",
      a: "SOC Fundamentals, Securonix SIEM, and related modules covering triage, log analysis, threat lifecycle, and platform operations.",
    },
    {
      q: "Are learning paths guided?",
      a: "Yes. Paths sequence courses in prerequisite order so each lesson builds on the one before it.",
    },
    {
      q: "Do you cover multiple SIEM tools?",
      a: "Content focuses on practical SOC workflows with deep Securonix coverage, plus stack familiarity across Splunk, QRadar, and Microsoft Sentinel.",
    },
    {
      q: "Will new courses be added?",
      a: "Yes. Pro plans include future course updates as the catalog grows.",
    },
  ],
  practice: [
    {
      q: "Are there hands-on labs?",
      a: "Yes. Practice investigation workflows, SIEM UI operations, and scenario-based triage inside guided modules.",
    },
    {
      q: "Can I track my progress?",
      a: "Your path shows completion and the next recommended module so you always know what to do next.",
    },
    {
      q: "Is there a community?",
      a: "Join other analysts via the community area and social channels for tips, discussions, and peer learning.",
    },
    {
      q: "Do labs mirror real SOC work?",
      a: "Labs are built around day-to-day analyst tasks — alert triage, evidence review, and SIEM navigation.",
    },
  ],
  pricing: [
    {
      q: "What is included in Pro?",
      a: "All career tracks, courses, labs, resources, progress tracking, and future catalog updates.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. Monthly plans cancel anytime. Yearly plans are billed once with access for the full term.",
    },
    {
      q: "Is there a money-back guarantee?",
      a: "Yes — a short money-back window so you can try the platform with confidence.",
    },
  ],
}
