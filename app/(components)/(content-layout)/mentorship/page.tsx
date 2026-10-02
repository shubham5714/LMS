"use client"

import Seo from "@/shared/layouts-components/seo/seo"
import React, { Fragment } from "react"
import { Card } from "react-bootstrap"

export default function MentorshipPage() {
  return (
    <Fragment>
      <Seo title="Mentorship" />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <h1 className="page-title fw-medium fs-18 mb-0">Mentorship</h1>
          <p className="text-muted mb-0 mt-1">
            Guided support from experienced SOC practitioners.
          </p>
        </div>
      </div>
      <Card className="custom-card">
        <Card.Body className="text-muted py-5 text-center">
          Mentorship is coming soon.
        </Card.Body>
      </Card>
    </Fragment>
  )
}
