/**
 * @deprecated Use shared/courses/tracks.ts
 * Kept for any leftover imports; maps old learning-path shape to tracks.
 */
import { TRACKS, type Track } from "@/shared/courses/tracks"

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

function toLearningPath(track: Track): LearningPath {
  return {
    id: track.id,
    title: track.title,
    description: track.description,
    focusArea: track.focusArea,
    skillLevel: track.skillLevel,
    courseIds: track.courseIds,
    estimatedHours: track.estimatedHours,
    icon: track.icon,
    accent: track.accent,
  }
}

export const LEARNING_PATHS: readonly LearningPath[] = TRACKS.map(toLearningPath)
