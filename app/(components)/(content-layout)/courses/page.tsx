"use client"

import { CourseCatalogCard } from "@/shared/components/courses/CourseCatalogCard"
import {
  COURSE_FOCUS_AREAS,
  COURSE_SKILL_LEVELS,
  filterCatalogCourses,
  type CatalogCourse,
} from "@/shared/courses/catalog"
import { fetchCatalogCoursesFromDb } from "@/shared/courses/course-structure-client"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import {
  fetchCatalogCourseProgress,
  type CourseProgress,
} from "@/shared/lib/courseTopicProgress"
import Seo from "@/shared/layouts-components/seo/seo"
import Link from "next/link"
import React, { Fragment, useEffect, useMemo, useState } from "react"
import { Card, Col, Form, Row } from "react-bootstrap"

export default function CoursesCatalogPage() {
  const { canEditCourseContent } = useMembershipContext()
  const [focusArea, setFocusArea] = useState("all")
  const [skillLevel, setSkillLevel] = useState("all")
  const [courses, setCourses] = useState<CatalogCourse[]>([])
  const [progressByCourse, setProgressByCourse] = useState<
    Record<string, CourseProgress>
  >({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const list = await fetchCatalogCoursesFromDb()
      if (cancelled) return
      setCourses(list)
      const progress = await fetchCatalogCourseProgress(list.map((c) => c.id))
      if (cancelled) return
      setProgressByCourse(progress)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () => filterCatalogCourses(courses, focusArea, skillLevel),
    [courses, focusArea, skillLevel]
  )

  return (
    <Fragment>
      <Seo title="Courses" />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <h1 className="page-title fw-medium fs-18 mb-0">Courses</h1>
          <p className="text-muted mb-0 mt-1">Browse courses by focus area and skill level.</p>
        </div>
        {canEditCourseContent ? (
          <Link href="/courses/manage" className="btn btn-sm btn-primary">
            Manage courses
          </Link>
        ) : null}
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
                {COURSE_FOCUS_AREAS.map((area) => (
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
                {COURSE_SKILL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} lg={3} className="ms-lg-auto">
              <p className="mb-0 text-muted small text-md-end">
                {loading
                  ? "Loading…"
                  : `${filtered.length} course${filtered.length === 1 ? "" : "s"}`}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {filtered.length === 0 && !loading ? (
          <Col xs={12}>
            <Card className="custom-card">
              <Card.Body className="text-center text-muted py-5">
                No courses match these filters. Try clearing a filter.
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filtered.map((course) => (
            <Col key={course.id} xl={4} md={6}>
              <CourseCatalogCard
                course={course}
                progress={progressByCourse[course.id]}
              />
            </Col>
          ))
        )}
      </Row>
    </Fragment>
  )
}
