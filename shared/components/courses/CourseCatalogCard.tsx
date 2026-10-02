"use client"

import type { CatalogCourse } from "@/shared/courses/catalog"
import type { CourseProgress } from "@/shared/lib/courseTopicProgress"
import Link from "next/link"
import React from "react"

function skillBadgeClass(level: CatalogCourse["skillLevel"]): string {
  if (level === "Beginner") return "course-catalog-card__level--beginner"
  if (level === "Advanced") return "course-catalog-card__level--advanced"
  return "course-catalog-card__level--intermediate"
}

export function CourseCatalogCard({
  course,
  progress,
}: {
  course: CatalogCourse
  progress?: CourseProgress
}) {
  const initial = course.instructor.name.trim().charAt(0).toUpperCase() || "?"
  const total = progress?.totalTopics ?? 0
  const completed = progress?.completedTopics ?? 0
  const percent = progress?.percent ?? 0
  const progressLabel =
    total > 0
      ? `${completed} of ${total} topics · ${percent}%`
      : "No topics yet"

  return (
    <Link
      href={course.href}
      scroll={false}
      className="course-catalog-card-link text-decoration-none"
    >
      <article className="course-catalog-card h-100">
        <div className="course-catalog-card__top">
          <span className="course-catalog-card__icon" aria-hidden>
            <i className={course.icon} />
          </span>
          <span
            className={`course-catalog-card__level ${skillBadgeClass(course.skillLevel)}`}
          >
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
          <span className="course-catalog-card__meta-right">
            {course.durationHours} hrs
          </span>
        </div>

        <div
          className="course-catalog-card__progress"
          aria-label={`Course progress: ${progressLabel}`}
        >
          <div className="course-catalog-card__progress-row">
            <span>Your progress</span>
            <span className="course-catalog-card__progress-pct">{percent}%</span>
          </div>
          <div
            className="course-catalog-card__progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className="course-catalog-card__progress-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="course-catalog-card__progress-meta">{progressLabel}</div>
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
              <span
                className="course-catalog-card__avatar course-catalog-card__avatar--fallback"
                aria-hidden
              >
                {initial}
              </span>
            )}
            <span className="course-catalog-card__instructor-name">
              {course.instructor.name}
            </span>
          </span>
          <span className="course-catalog-card__breakdown">
            {course.modules} modules · {course.lessons} lessons
          </span>
        </div>
      </article>
    </Link>
  )
}
