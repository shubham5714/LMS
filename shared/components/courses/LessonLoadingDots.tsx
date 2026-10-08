import React from "react"

type Props = {
  /** Wrap in the lesson column so the loader stays in the same place as content. */
  inLessonShell?: boolean
}

/** Centered three-dot wave loader for course lesson pages. */
export function LessonLoadingDots({ inLessonShell = false }: Props) {
  const dots = (
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

  if (!inLessonShell) return dots

  return (
    <div className="soc-fundamentals-topic course-topic-lesson">
      <div className="soc-fundamentals-topic-layout">
        <div className="soc-fundamentals-topic-main">{dots}</div>
      </div>
    </div>
  )
}
