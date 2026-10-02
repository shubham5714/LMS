"use client"

import {
  getTracksByKind,
  trackHref,
  type Track,
  type TrackKind,
} from "@/shared/courses/tracks"
import Seo from "@/shared/layouts-components/seo/seo"
import Link from "next/link"
import React, { Fragment } from "react"
import { Card, Col, Row } from "react-bootstrap"

function TrackCard({ track }: { track: Track }) {
  return (
    <Col xl={6}>
      <Link
        href={trackHref(track)}
        scroll={false}
        className="text-decoration-none text-reset d-block h-100"
      >
        <Card className="custom-card h-100 track-card">
          <Card.Body className="d-flex flex-column">
            <div className="d-flex align-items-start gap-3 mb-3">
              <span
                className={`avatar avatar-md avatar-rounded bg-${track.accent}-transparent flex-shrink-0`}
              >
                <i
                  className={`${track.icon} fs-18 text-${track.accent}`}
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <h5 className="fw-semibold mb-1">{track.title}</h5>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-primary-transparent">
                    {track.focusArea}
                  </span>
                  <span className="badge bg-secondary-transparent">
                    {track.skillLevel}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-muted mb-3 flex-grow-1">{track.description}</p>
            <div className="d-flex align-items-center justify-content-between gap-2 mt-auto">
              <span className="text-muted small">
                <i className="ri-time-line me-1" aria-hidden />~
                {track.estimatedHours} hours · {track.courseIds.length} course
                {track.courseIds.length === 1 ? "" : "s"}
              </span>
              <span className={`btn btn-${track.accent} btn-sm`}>
                View courses
              </span>
            </div>
          </Card.Body>
        </Card>
      </Link>
    </Col>
  )
}

export function TrackListPage({
  kind,
  title,
  lead,
}: {
  kind: TrackKind
  title: string
  lead: string
}) {
  const tracks = getTracksByKind(kind)

  return (
    <Fragment>
      <Seo title={title} />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/tracks" scroll={false}>
                  Tracks
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {title}
              </li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">{title}</h1>
          <p className="text-muted mb-0 mt-1">{lead}</p>
        </div>
      </div>

      <Row className="g-4">
        {tracks.length === 0 ? (
          <Col xs={12}>
            <Card className="custom-card">
              <Card.Body className="text-center text-muted py-5">
                No tracks in this category yet.
              </Card.Body>
            </Card>
          </Col>
        ) : (
          tracks.map((track) => <TrackCard key={track.id} track={track} />)
        )}
      </Row>
    </Fragment>
  )
}
