import React from "react"

/** Centered three-dot wave loader for course lesson pages. */
export function LessonLoadingDots() {
  return (
    <div
      className="lesson-loading-dots"
      role="status"
      aria-label="Loading lesson"
    >
      <span />
      <span />
      <span />
    </div>
  )
}
