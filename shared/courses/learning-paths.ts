export type LearningPath = {
  id: string
  title: string
  description: string
  focusArea: string
  skillLevel: string
  courseIds: readonly string[]
  estimatedHours: number
  icon: string
  accent: string
}

export const LEARNING_PATHS: readonly LearningPath[] = [
  {
    id: "soc-analyst",
    title: "SOC Analyst Path",
    description:
      "Build a foundation in security operations, then deepen SIEM skills with Securonix for day-to-day analyst work.",
    focusArea: "Security Operations",
    skillLevel: "Beginner → Intermediate",
    courseIds: ["soc-fundamentals", "securonix-siem"],
    estimatedHours: 12,
    icon: "ri-route-line",
    accent: "primary",
  },
  {
    id: "siem-practitioner",
    title: "SIEM Practitioner Path",
    description:
      "Focus on Securonix SIEM end-to-end: architecture, activation, UI, AI agents, and Hub installation.",
    focusArea: "SIEM",
    skillLevel: "Intermediate",
    courseIds: ["securonix-siem"],
    estimatedHours: 8,
    icon: "ri-git-branch-line",
    accent: "info",
  },
]
