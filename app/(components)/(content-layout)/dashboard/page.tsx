"use client"

import SkillsRadarCard from "@/shared/components/dashboard/SkillsRadarCard"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import { useUserContext } from "@/shared/contextapi/UserContext"
import { getTracksByKind, getTrackById } from "@/shared/courses/tracks"
import { fetchCatalogCourseProgress } from "@/shared/lib/courseTopicProgress"
import { fetchCourseSkillWeights } from "@/shared/lib/fetchCourseSkillWeights"
import {
  computeSkillRadar,
  type SkillRadarPoint,
} from "@/shared/lib/skillRadar"
import Seo from "@/shared/layouts-components/seo/seo"
import React, { Fragment, useCallback, useEffect, useState } from "react"
import { Card, Col, Row } from "react-bootstrap"

const CAREER_TRACKS = getTracksByKind("career")
const CAREER_TRACK_OPTIONS = CAREER_TRACKS.map((t) => ({
  id: t.id,
  title: t.title,
}))
const DEFAULT_TRACK_ID = CAREER_TRACKS[0]?.id ?? ""

export default function DashboardPage() {
  const { membershipRecord } = useMembershipContext()
  const { userData, isAuthenticated, isLoading: userLoading } = useUserContext()
  const displayName =
    membershipRecord?.username?.trim() ||
    userData?.username?.trim() ||
    "there"

  const [selectedTrackId, setSelectedTrackId] = useState(DEFAULT_TRACK_ID)
  const [points, setPoints] = useState<SkillRadarPoint[]>([])
  const [radarLoading, setRadarLoading] = useState(true)
  const [prefsReady, setPrefsReady] = useState(false)

  const loadRadar = useCallback(async (trackId: string) => {
    const track = getTrackById(trackId)
    if (!track || track.kind !== "career") {
      setPoints([])
      setRadarLoading(false)
      return
    }

    setRadarLoading(true)
    try {
      const courseIds = track.courseIds
      const [weights, progressMap] = await Promise.all([
        fetchCourseSkillWeights(courseIds),
        fetchCatalogCourseProgress(courseIds),
      ])

      const progressByCourse: Record<string, number> = {}
      for (const id of courseIds) {
        progressByCourse[id] = progressMap[id]?.percent ?? 0
      }

      setPoints(computeSkillRadar(weights, progressByCourse))
    } finally {
      setRadarLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userLoading) return

    let cancelled = false

    const init = async () => {
      if (!isAuthenticated) {
        setPrefsReady(true)
        setRadarLoading(false)
        return
      }

      try {
        const res = await fetch("/api/dashboard/preferences")
        if (res.ok) {
          const json = (await res.json()) as { selectedTrackId?: string | null }
          const track = json.selectedTrackId
            ? getTrackById(json.selectedTrackId)
            : undefined
          if (!cancelled && track?.kind === "career") {
            setSelectedTrackId(track.id)
          }
        }
      } catch {
        // keep default track
      } finally {
        if (!cancelled) setPrefsReady(true)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [userLoading, isAuthenticated])

  useEffect(() => {
    if (!prefsReady || userLoading) return
    if (!isAuthenticated) {
      setPoints([])
      setRadarLoading(false)
      return
    }
    void loadRadar(selectedTrackId || DEFAULT_TRACK_ID)
  }, [
    prefsReady,
    userLoading,
    isAuthenticated,
    selectedTrackId,
    loadRadar,
  ])

  const onTrackChange = async (trackId: string) => {
    setSelectedTrackId(trackId)
    if (!isAuthenticated) return
    try {
      await fetch("/api/dashboard/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTrackId: trackId }),
      })
    } catch (e) {
      console.error("Failed to save dashboard preference", e)
    }
  }

  const loading = userLoading || !prefsReady || radarLoading

  return (
    <Fragment>
      <Seo title="Dashboard" />

      <div className="my-4 page-header-breadcrumb">
        <p className="fw-medium fs-20 mb-0">
          Hey, {displayName} &#128075;
        </p>
      </div>

      <Row className="g-4">
        <Col xl={6}>
          <SkillsRadarCard
            tracks={CAREER_TRACK_OPTIONS}
            selectedTrackId={selectedTrackId || DEFAULT_TRACK_ID}
            onTrackChange={(id) => void onTrackChange(id)}
            points={points}
            loading={loading}
            signedIn={isAuthenticated}
          />
        </Col>
        <Col xl={6}>
          <Card className="custom-card h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center py-5">
              <div className="text-muted mb-2">
                <i className="ri-layout-grid-line fs-2" aria-hidden />
              </div>
              <p className="fw-medium mb-1">More widgets coming soon</p>
              <p className="fs-13 text-muted mb-0">
                This half is reserved for future dashboard widgets.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  )
}
