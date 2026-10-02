"use client"

import { TrackListPage } from "@/shared/components/courses/TrackListPage"
import React from "react"

export default function CareerTracksPage() {
  return (
    <TrackListPage
      kind="career"
      title="Career Tracks"
      lead="Role-based sequences. Open a track to see its courses."
    />
  )
}
