"use client"

import { createReactBlockSpec } from "@blocknote/react"
import { PremiumSectionOverlay } from "@/shared/components/courses/PremiumSectionOverlay"
import { useCourseDocAccess } from "./CourseDocAccessContext"
import React, { useEffect, useState } from "react"

/** Editor marker: premium content starts after this block. */
export const PremiumStart = createReactBlockSpec(
  {
    type: "premiumStart",
    propSchema: {
      title: { default: "Premium section" },
      previewSrc: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { canEdit } = useCourseDocAccess()
      const storedTitle =
        (typeof props.block.props.title === "string" &&
          props.block.props.title.trim()) ||
        "Premium section"
      const [draftTitle, setDraftTitle] = useState(storedTitle)

      useEffect(() => {
        setDraftTitle(storedTitle)
      }, [storedTitle])

      if (!canEdit) return null

      const persistTitle = (next: string) => {
        const title = next.trim() || "Premium section"
        props.editor.updateBlock(props.block, {
          type: "premiumStart",
          props: {
            title,
            previewSrc:
              typeof props.block.props.previewSrc === "string"
                ? props.block.props.previewSrc
                : "",
          },
        })
        setDraftTitle(title)
      }

      return (
        <div
          className="bn-premium-marker bn-premium-marker--start"
          id={props.block.id}
          data-premium-start
          contentEditable={false}
          style={{ scrollMarginTop: "6.5rem" }}
        >
          <i className="ri-lock-2-fill" aria-hidden />
          <div className="bn-premium-marker__body">
            <span>
              Premium starts — add any blocks below. FREE users see one unlock
              notice for this whole section.
            </span>
            <label className="bn-premium-marker__label">
              Right-nav title
              <input
                type="text"
                className="bn-premium-marker__input form-control form-control-sm"
                value={draftTitle}
                placeholder="Premium section"
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={() => persistTitle(draftTitle)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
              />
            </label>
          </div>
        </div>
      )
    },
  }
)

/** Editor marker: premium content ends before this block. */
export const PremiumEnd = createReactBlockSpec(
  {
    type: "premiumEnd",
    propSchema: {},
    content: "none",
  },
  {
    render: () => {
      const { canEdit } = useCourseDocAccess()
      if (!canEdit) return null
      return (
        <div className="bn-premium-marker bn-premium-marker--end" data-premium-end>
          <i className="ri-lock-unlock-fill" aria-hidden />
          <span>Premium ends — free content can continue below</span>
        </div>
      )
    },
  }
)

/**
 * Shown only to FREE readers — one gate replacing an entire premium range.
 * Never inserted by editors; produced by preparePremiumBlocksForViewer.
 */
export const PremiumGate = createReactBlockSpec(
  {
    type: "premiumGate",
    propSchema: {
      title: { default: "Premium section" },
      previewSrc: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const previewSrc = props.block.props.previewSrc?.trim()
      return (
        <div
          className="bn-premium-gate"
          id={props.block.id}
          data-paid-section
          style={{ scrollMarginTop: "6.5rem" }}
        >
          <PremiumSectionOverlay locked>
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt={props.block.props.title || "Premium preview"}
                className="img-fluid w-100 d-block rounded-3"
              />
            ) : (
              null
            )}
          </PremiumSectionOverlay>
        </div>
      )
    },
  }
)
