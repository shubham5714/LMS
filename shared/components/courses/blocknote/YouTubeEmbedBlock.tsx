"use client"

import { createReactBlockSpec } from "@blocknote/react"
import { YouTubeEmbed } from "@/shared/components/courses/YouTubeEmbed"
import { normalizeYoutubeEmbedUrl } from "@/shared/courses/youtube-embed-url"
import { useCourseDocAccess } from "./CourseDocAccessContext"
import React, { useEffect, useState } from "react"

function readStoredVideoUrl(props: Record<string, unknown>): string {
  const videoUrl = typeof props.videoUrl === "string" ? props.videoUrl : ""
  const legacyUrl = typeof props.url === "string" ? props.url : ""
  const raw = videoUrl.trim() || legacyUrl.trim()
  return normalizeYoutubeEmbedUrl(raw) || raw
}

export const YouTubeEmbedBlock = createReactBlockSpec(
  {
    type: "youtubeEmbed",
    propSchema: {
      // Avoid prop name `url` — BlockNote File UI hooks onto it.
      videoUrl: { default: "" },
      title: { default: "YouTube video" },
    },
    content: "none",
  },
  {
    meta: {
      selectable: false,
    },
    parse: (element) => {
      if (element.tagName === "IFRAME") {
        const src = element.getAttribute("src") || ""
        const normalized = normalizeYoutubeEmbedUrl(src)
        if (!normalized) return undefined
        return {
          videoUrl: normalized,
          title: element.getAttribute("title") || "YouTube video",
        }
      }

      const iframe = element.querySelector?.("iframe")
      if (iframe) {
        const src = iframe.getAttribute("src") || ""
        const normalized = normalizeYoutubeEmbedUrl(src)
        if (!normalized) return undefined
        return {
          videoUrl: normalized,
          title: iframe.getAttribute("title") || "YouTube video",
        }
      }

      return undefined
    },
    render: (props) => {
      const { canEdit } = useCourseDocAccess()
      const blockProps = props.block.props as Record<string, unknown>
      const stored = readStoredVideoUrl(blockProps)
      const title =
        (typeof props.block.props.title === "string" &&
          props.block.props.title.trim()) ||
        "YouTube video"

      const [draftUrl, setDraftUrl] = useState(
        typeof blockProps.videoUrl === "string" && blockProps.videoUrl
          ? blockProps.videoUrl
          : stored
      )
      const [draftTitle, setDraftTitle] = useState(title)
      const [previewArmed, setPreviewArmed] = useState(false)

      useEffect(() => {
        setDraftUrl(
          typeof blockProps.videoUrl === "string" && blockProps.videoUrl
            ? blockProps.videoUrl
            : stored
        )
      }, [stored, blockProps.videoUrl])

      useEffect(() => {
        setDraftTitle(title)
      }, [title])

      useEffect(() => {
        setPreviewArmed(false)
      }, [stored])

      const persist = (nextUrl: string, nextTitle: string) => {
        const normalized = normalizeYoutubeEmbedUrl(nextUrl) || nextUrl.trim()
        props.editor.updateBlock(props.block, {
          type: "youtubeEmbed",
          props: {
            videoUrl: normalized,
            title: nextTitle.trim() || "YouTube video",
          },
        })
        return normalized
      }

      useEffect(() => {
        if (!canEdit) return
        const normalized = normalizeYoutubeEmbedUrl(draftUrl)
        if (!normalized) return
        if (normalized === stored) return
        props.editor.updateBlock(props.block, {
          type: "youtubeEmbed",
          props: {
            videoUrl: normalized,
            title: draftTitle.trim() || "YouTube video",
          },
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when draft URL becomes valid
      }, [draftUrl, canEdit])

      if (canEdit) {
        const previewSrc =
          normalizeYoutubeEmbedUrl(draftUrl) ||
          normalizeYoutubeEmbedUrl(stored) ||
          null

        return (
          <div
            className="bn-youtube-embed bn-youtube-embed--editing"
            contentEditable={false}
          >
            <div className="bn-youtube-embed__header">
              <i className="ri-youtube-line" aria-hidden />
              <strong>YouTube video</strong>
            </div>
            <p className="bn-youtube-embed__hint">
              Paste a YouTube watch, share, or embed URL (not the default Video
              block — that only plays direct <code>.mp4</code> files). Preview
              updates automatically — then click <strong>Save</strong>.
            </p>
            <label className="bn-youtube-embed__label">
              YouTube URL
              <input
                type="url"
                className="bn-youtube-embed__input form-control"
                value={draftUrl}
                placeholder="https://www.youtube.com/watch?v=…"
                onChange={(e) => setDraftUrl(e.target.value)}
                onBlur={() => {
                  const normalized = persist(draftUrl, draftTitle)
                  setDraftUrl(normalized)
                }}
              />
            </label>
            <label className="bn-youtube-embed__label">
              Title (optional)
              <input
                type="text"
                className="bn-youtube-embed__input form-control"
                value={draftTitle}
                placeholder="YouTube video"
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={() => persist(draftUrl, draftTitle)}
              />
            </label>
            {previewSrc ? (
              <div className="bn-youtube-embed__preview">
                <p className="bn-youtube-embed__resolved small mb-2">
                  Preview using: <code>{previewSrc}</code>
                </p>
                {previewArmed ? (
                  <YouTubeEmbed src={previewSrc} title={draftTitle || title} />
                ) : (
                  <div className="bn-youtube-embed__preview-placeholder">
                    <p className="small mb-2">
                      Preview is off while editing so the slash menu stays usable.
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setPreviewArmed(true)}
                    >
                      Load preview
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="bn-youtube-embed__empty-preview">
                No preview yet — paste{" "}
                <code>https://www.youtube.com/watch?v=…</code>
              </p>
            )}
          </div>
        )
      }

      if (!stored) {
        return (
          <div className="bn-youtube-embed bn-youtube-embed--missing">
            YouTube video is not configured for this lesson yet.
          </div>
        )
      }

      return (
        <div className="bn-youtube-embed bn-youtube-embed--reader">
          <YouTubeEmbed src={stored} title={title} />
        </div>
      )
    },
  }
)
