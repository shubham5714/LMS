export type CourseSkillWeight = {
  courseId: string
  skillId: string
  skillName: string
  weight: number
}

export type SkillRadarPoint = {
  skillId: string
  skillName: string
  /** Weighted completion 0–100 */
  percent: number
}

/**
 * Aggregate per-skill completion across courses:
 * skillPercent(S) = Σ (progress%(c) × weight(c,S)) / Σ weight(c,S)
 */
export function computeSkillRadar(
  skillsByCourse: readonly CourseSkillWeight[],
  progressByCourse: Readonly<Record<string, number>>
): SkillRadarPoint[] {
  type Acc = {
    skillId: string
    skillName: string
    weightedSum: number
    totalWeight: number
  }

  const bySkill = new Map<string, Acc>()

  for (const row of skillsByCourse) {
    if (!row.skillId || !(row.weight > 0)) continue
    const progress = progressByCourse[row.courseId]
    const percent =
      typeof progress === "number" && Number.isFinite(progress)
        ? Math.min(100, Math.max(0, progress))
        : 0

    const existing = bySkill.get(row.skillId)
    if (existing) {
      existing.weightedSum += percent * row.weight
      existing.totalWeight += row.weight
      // Prefer a non-empty display name if later rows refine it
      if (row.skillName?.trim()) existing.skillName = row.skillName.trim()
    } else {
      bySkill.set(row.skillId, {
        skillId: row.skillId,
        skillName: row.skillName?.trim() || row.skillId,
        weightedSum: percent * row.weight,
        totalWeight: row.weight,
      })
    }
  }

  return [...bySkill.values()]
    .map((acc) => ({
      skillId: acc.skillId,
      skillName: acc.skillName,
      percent:
        acc.totalWeight === 0
          ? 0
          : Math.round((acc.weightedSum / acc.totalWeight) * 10) / 10,
    }))
    .sort((a, b) => a.skillName.localeCompare(b.skillName))
}
