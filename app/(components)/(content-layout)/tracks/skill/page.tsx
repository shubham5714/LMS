"use client"

import { TrackListPage } from "@/shared/components/courses/TrackListPage"
import React from "react"

export default function SkillTracksPage() {
  return (
    <TrackListPage
      kind="skill"
      title="Skill Tracks"
      lead="Capability-focused sequences. Open a track to see its courses."
    />
  )
}
