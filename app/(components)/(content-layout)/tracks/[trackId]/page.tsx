"use client"

import { CourseCatalogCard } from "@/shared/components/courses/CourseCatalogCard"
import type { CatalogCourse } from "@/shared/courses/catalog"
import { fetchCatalogCoursesFromDb } from "@/shared/courses/course-structure-client"
import {
  getTrackById,
  trackKindHref,
  trackKindLabel,
} from "@/shared/courses/tracks"
import {
  fetchCatalogCourseProgress,
  type CourseProgress,
} from "@/shared/lib/courseTopicProgress"
import Seo from "@/shared/layouts-components/seo/seo"
import Link from "next/link"
import { useParams } from "next/navigation"
import React, { Fragment, useEffect, useMemo, useState } from "react"
import { Card, Col, Row } from "react-bootstrap"

const RESERVED = new Set(["career", "skill"])

export default function TrackDetailPage() {
  const params = useParams()
  const trackId = String(params.trackId || "")
  const track = useMemo(
    () => (RESERVED.has(trackId) ? undefined : getTrackById(trackId)),
    [trackId]
  )

  const [courses, setCourses] = useState<CatalogCourse[]>([])
  const [progressByCourse, setProgressByCourse] = useState<
    Record<string, CourseProgress>
  >({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!track) {
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const all = await fetchCatalogCoursesFromDb()
      if (cancelled) return
      const ordered = track.courseIds
        .map((id) => all.find((c) => c.id === id))
        .filter((c): c is CatalogCourse => Boolean(c))
      setCourses(ordered)
      const progress = await fetchCatalogCourseProgress(
        ordered.map((c) => c.id)
      )
      if (cancelled) return
      setProgressByCourse(progress)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [track])

  if (!track) {
    return (
      <Fragment>
        <Seo title="Track not found" />
        <Card className="custom-card">
          <Card.Body>
            <h1 className="h5 mb-2">Track not found</h1>
            <p className="text-muted mb-3">
              No track matches <code>{trackId}</code>.
            </p>
            <Link href="/tracks" className="btn btn-sm btn-primary">
              Back to Tracks
            </Link>
          </Card.Body>
        </Card>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <Seo title={`${track.title} · Tracks`} />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/tracks" scroll={false}>
                  Tracks
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href={trackKindHref(track.kind)} scroll={false}>
                  {trackKindLabel(track.kind)}
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {track.title}
              </li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">{track.title}</h1>
          <p className="text-muted mb-0 mt-1">{track.description}</p>
          <div className="d-flex flex-wrap gap-2 mt-2">
            <span className="badge bg-primary-transparent">{track.focusArea}</span>
            <span className="badge bg-secondary-transparent">
              {track.skillLevel}
            </span>
            <span className="badge bg-light text-muted">
              ~{track.estimatedHours} hrs · {track.courseIds.length} courses
            </span>
          </div>
        </div>
      </div>

      <h2 className="fs-16 fw-semibold mb-3">Courses in this track</h2>

      {loading ? (
        <p className="text-muted">Loading courses…</p>
      ) : courses.length === 0 ? (
        <Card className="custom-card">
          <Card.Body className="text-muted">
            No courses are linked to this track yet.
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {courses.map((course) => (
            <Col key={course.id} xl={4} md={6}>
              <CourseCatalogCard
                course={course}
                progress={progressByCourse[course.id]}
              />
            </Col>
          ))}
        </Row>
      )}
    </Fragment>
  )
}
