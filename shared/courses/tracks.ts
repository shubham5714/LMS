export type TrackKind = "career" | "skill"

export type Track = {
  id: string
  kind: TrackKind
  title: string
  description: string
  focusArea: string
  skillLevel: string
  /** Ordered course ids shown on the track detail page */
  courseIds: readonly string[]
  estimatedHours: number
  icon: string
  accent: string
}

export const TRACK_KINDS: readonly {
  id: TrackKind
  title: string
  description: string
  href: string
  icon: string
  accent: string
}[] = [
  {
    id: "career",
    title: "Career Tracks",
    description:
      "Role-based paths that combine multiple courses into a job-ready sequence.",
    href: "/tracks/career",
    icon: "ri-briefcase-4-line",
    accent: "primary",
  },
  {
    id: "skill",
    title: "Skill Tracks",
    description:
      "Focused sequences to deepen a specific capability across one or more courses.",
    href: "/tracks/skill",
    icon: "ri-flashlight-line",
    accent: "info",
  },
]

export const TRACKS: readonly Track[] = [
  {
    id: "soc-analyst",
    kind: "career",
    title: "SOC Analyst",
    description:
      "Build a foundation in security operations, then deepen SIEM skills with Securonix for day-to-day analyst work.",
    focusArea: "Security Operations",
    skillLevel: "Beginner → Intermediate",
    courseIds: ["soc-fundamentals", "securonix-siem"],
    estimatedHours: 15,
    icon: "ri-shield-user-line",
    accent: "primary",
  },
  {
    id: "siem-practitioner",
    kind: "skill",
    title: "SIEM Practitioner",
    description:
      "Focus on Securonix SIEM end-to-end: architecture, activation, UI, AI agents, and Hub installation.",
    focusArea: "SIEM",
    skillLevel: "Intermediate",
    courseIds: ["securonix-siem"],
    estimatedHours: 9,
    icon: "ri-radar-line",
    accent: "info",
  },
]

export function getTracksByKind(kind: TrackKind): Track[] {
  return TRACKS.filter((t) => t.kind === kind)
}

export function getTrackById(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id)
}

export function trackHref(track: Track): string {
  return `/tracks/${track.id}`
}

export function trackKindLabel(kind: TrackKind): string {
  return kind === "career" ? "Career Tracks" : "Skill Tracks"
}

export function trackKindHref(kind: TrackKind): string {
  return kind === "career" ? "/tracks/career" : "/tracks/skill"
}
