"use client"

import {
  CATALOG_COURSES,
  COURSE_FOCUS_AREAS,
  COURSE_SKILL_LEVELS,
  filterCatalogCourses,
  type CatalogCourse,
} from "@/shared/courses/catalog"
import Seo from "@/shared/layouts-components/seo/seo"
import Link from "next/link"
import React, { Fragment, useMemo, useState } from "react"
import { Card, Col, Form, Row } from "react-bootstrap"

function skillBadgeClass(level: CatalogCourse["skillLevel"]): string {
  if (level === "Beginner") return "course-catalog-card__level--beginner"
  if (level === "Advanced") return "course-catalog-card__level--advanced"
  return "course-catalog-card__level--intermediate"
}

function CourseCatalogCard({ course }: { course: CatalogCourse }) {
  const initial = course.instructor.name.trim().charAt(0).toUpperCase() || "?"

  return (
    <Link href={course.href} scroll={false} className="course-catalog-card-link text-decoration-none">
      <article className="course-catalog-card h-100">
        <div className="course-catalog-card__top">
          <span className="course-catalog-card__icon" aria-hidden>
            <i className={course.icon} />
          </span>
          <span className={`course-catalog-card__level ${skillBadgeClass(course.skillLevel)}`}>
            {course.skillLevel}
          </span>
        </div>

        <h3 className="course-catalog-card__title">{course.title}</h3>
        <p className="course-catalog-card__desc">{course.description}</p>

        <div className="course-catalog-card__meta">
          <span className="course-catalog-card__meta-left">
            <i className="ri-group-line" aria-hidden />
            {course.studentsLabel}
          </span>
          <span className="course-catalog-card__meta-right">{course.durationHours} hrs</span>
        </div>

        <div className="course-catalog-card__footer">
          <span className="course-catalog-card__instructor">
            {course.instructor.avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.instructor.avatarSrc}
                alt=""
                className="course-catalog-card__avatar"
              />
            ) : (
              <span className="course-catalog-card__avatar course-catalog-card__avatar--fallback" aria-hidden>
                {initial}
              </span>
            )}
            <span className="course-catalog-card__instructor-name">{course.instructor.name}</span>
          </span>
          <span className="course-catalog-card__breakdown">
            {course.modules} modules · {course.lessons} lessons
          </span>
        </div>
      </article>
    </Link>
  )
}

export default function CoursesCatalogPage() {
  const [focusArea, setFocusArea] = useState("all")
  const [skillLevel, setSkillLevel] = useState("all")

  const filtered = useMemo(
    () => filterCatalogCourses(CATALOG_COURSES, focusArea, skillLevel),
    [focusArea, skillLevel]
  )

  return (
    <Fragment>
      <Seo title="Courses" />
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-3">
        <div>
          <h1 className="page-title fw-medium fs-18 mb-0">Courses</h1>
          <p className="text-muted mb-0 mt-1">Browse courses by focus area and skill level.</p>
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
                {filtered.length} course{filtered.length === 1 ? "" : "s"}
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
                No courses match these filters. Try clearing a filter.
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filtered.map((course) => (
            <Col key={course.id} xl={4} md={6}>
              <CourseCatalogCard course={course} />
            </Col>
          ))
        )}
      </Row>
    </Fragment>
  )
}
