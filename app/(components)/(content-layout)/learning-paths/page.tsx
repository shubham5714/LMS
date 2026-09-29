"use client"

import { CATALOG_COURSES } from "@/shared/courses/catalog"
import { LEARNING_PATHS } from "@/shared/courses/learning-paths"
import Seo from "@/shared/layouts-components/seo/seo"
import Link from "next/link"
import React, { Fragment, useMemo, useState } from "react"
import { Card, Col, Form, Row } from "react-bootstrap"

export default function LearningPathsPage() {
  const [focusArea, setFocusArea] = useState("all")
  const [skillLevel, setSkillLevel] = useState("all")

  const focusOptions = useMemo(
    () => Array.from(new Set(LEARNING_PATHS.map((p) => p.focusArea))),
    []
  )
  const skillOptions = useMemo(
    () => Array.from(new Set(LEARNING_PATHS.map((p) => p.skillLevel))),
    []
  )

  const filtered = useMemo(
    () =>
      LEARNING_PATHS.filter((p) => {
        const focusOk = focusArea === "all" || p.focusArea === focusArea
        const skillOk = skillLevel === "all" || p.skillLevel === skillLevel
        return focusOk && skillOk
      }),
    [focusArea, skillLevel]
  )

  const courseTitleById = useMemo(() => {
    const map = new Map(CATALOG_COURSES.map((c) => [c.id, c]))
    return map
  }, [])

  return (
    <Fragment>
      <Seo title="Learning Paths" />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <h1 className="page-title fw-medium fs-18 mb-0">Learning Paths</h1>
          <p className="text-muted mb-0 mt-1">
            Guided sequences of courses by focus area and skill level.
          </p>
        </div>
      </div>

      <Card className="custom-card mb-4">
        <Card.Body className="py-3">
          <Row className="g-3 align-items-end">
            <Col md={4} lg={3}>
              <Form.Label className="form-label mb-1">Focus area</Form.Label>
              <Form.Select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                aria-label="Filter by focus area"
              >
                <option value="all">All focus areas</option>
                {focusOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} lg={3}>
              <Form.Label className="form-label mb-1">Skill level</Form.Label>
              <Form.Select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                aria-label="Filter by skill level"
              >
                <option value="all">All skill levels</option>
                {skillOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} lg={3} className="ms-lg-auto">
              <p className="mb-0 text-muted small text-md-end">
                {filtered.length} path{filtered.length === 1 ? "" : "s"}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {filtered.length === 0 ? (
          <Col xs={12}>
            <Card className="custom-card">
              <Card.Body className="text-center text-muted py-5">
                No learning paths match these filters.
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filtered.map((path) => {
            const firstCourse = path.courseIds
              .map((id) => courseTitleById.get(id))
              .find(Boolean)
            return (
              <Col key={path.id} xl={6}>
                <Card className="custom-card h-100 learning-path-card">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <span
                        className={`avatar avatar-md avatar-rounded bg-${path.accent}-transparent flex-shrink-0`}
                      >
                        <i className={`${path.icon} fs-18 text-${path.accent}`} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h5 className="fw-semibold mb-1">{path.title}</h5>
                        <div className="d-flex flex-wrap gap-2">
                          <span className="badge bg-primary-transparent">{path.focusArea}</span>
                          <span className="badge bg-secondary-transparent">{path.skillLevel}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted mb-3">{path.description}</p>
                    <ul className="list-unstyled mb-3">
                      {path.courseIds.map((id) => {
                        const course = courseTitleById.get(id)
                        if (!course) return null
                        return (
                          <li key={id} className="d-flex align-items-center gap-2 mb-2">
                            <i className="ri-checkbox-blank-circle-line text-muted fs-10" aria-hidden />
                            <Link href={course.href} scroll={false} className="text-decoration-none">
                              {course.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="d-flex align-items-center justify-content-between gap-2 mt-auto">
                      <span className="text-muted small">
                        <i className="ri-time-line me-1" aria-hidden />~
                        {path.estimatedHours} hours · {path.courseIds.length} course
                        {path.courseIds.length === 1 ? "" : "s"}
                      </span>
                      {firstCourse ? (
                        <Link
                          href={firstCourse.href}
                          scroll={false}
                          className="btn btn-primary btn-sm"
                        >
                          Start path
                        </Link>
                      ) : null}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          })
        )}
      </Row>
    </Fragment>
  )
}
