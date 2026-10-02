"use client"

import Seo from "@/shared/layouts-components/seo/seo"
import React, { Fragment } from "react"
import { Card } from "react-bootstrap"

export default function LabsPage() {
  return (
    <Fragment>
      <Seo title="Labs" />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <h1 className="page-title fw-medium fs-18 mb-0">Labs</h1>
          <p className="text-muted mb-0 mt-1">
            Hands-on practice environments for SOC and SIEM skills.
          </p>
        </div>
      </div>
      <Card className="custom-card">
        <Card.Body className="text-muted py-5 text-center">
          Labs are coming soon.
        </Card.Body>
      </Card>
    </Fragment>
  )
}
