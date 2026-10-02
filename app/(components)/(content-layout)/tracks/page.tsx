"use client"

import { TRACK_KINDS } from "@/shared/courses/tracks"
import Seo from "@/shared/layouts-components/seo/seo"
import Link from "next/link"
import React, { Fragment } from "react"
import { Card, Col, Row } from "react-bootstrap"

export default function TracksHubPage() {
  return (
    <Fragment>
      <Seo title="Tracks" />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <h1 className="page-title fw-medium fs-18 mb-0">Tracks</h1>
          <p className="text-muted mb-0 mt-1">
            Choose a Career Track or Skill Track, then open the courses inside.
          </p>
        </div>
      </div>

      <Row className="g-4">
        {TRACK_KINDS.map((kind) => (
          <Col key={kind.id} md={6}>
            <Link
              href={kind.href}
              scroll={false}
              className="text-decoration-none text-reset d-block h-100"
            >
              <Card className="custom-card h-100 track-kind-card">
                <Card.Body className="d-flex flex-column p-4">
                  <span
                    className={`avatar avatar-lg avatar-rounded bg-${kind.accent}-transparent mb-3`}
                  >
                    <i
                      className={`${kind.icon} fs-22 text-${kind.accent}`}
                      aria-hidden
                    />
                  </span>
                  <h3 className="h5 fw-semibold mb-2">{kind.title}</h3>
                  <p className="text-muted mb-4 flex-grow-1">{kind.description}</p>
                  <span className={`btn btn-${kind.accent} btn-sm align-self-start`}>
                    Browse {kind.title}
                  </span>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Fragment>
  )
}
