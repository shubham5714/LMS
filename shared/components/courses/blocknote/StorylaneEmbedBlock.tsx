"use client"

import { createReactBlockSpec } from "@blocknote/react"
import { StorylaneEmbed } from "@/shared/components/courses/StorylaneEmbed"
import { normalizeStorylaneEmbedUrl } from "@/shared/courses/storylane-embed-url"
import { useCourseDocAccess } from "./CourseDocAccessContext"
import React, { useEffect, useState } from "react"

function readStoredDemoUrl(props: Record<string, unknown>): string {
  const demoUrl = typeof props.demoUrl === "string" ? props.demoUrl : ""
  const legacyUrl = typeof props.url === "string" ? props.url : ""
  const raw = demoUrl.trim() || legacyUrl.trim()
  return normalizeStorylaneEmbedUrl(raw) || raw
}

export const StorylaneEmbedBlock = createReactBlockSpec(
  {
    type: "storylaneEmbed",
    propSchema: {
      // Avoid prop name `url` — BlockNote File UI hooks onto it.
      demoUrl: { default: "" },
      title: { default: "Interactive demo" },
    },
    content: "none",
  },
  {
    meta: {
      // Lets users interact with the iframe without BlockNote stealing focus
      selectable: false,
    },
    parse: (element) => {
      if (element.tagName === "IFRAME") {
        const src = element.getAttribute("src") || ""
        const normalized = normalizeStorylaneEmbedUrl(src)
        if (!normalized) return undefined
        return {
          demoUrl: normalized,
          title: element.getAttribute("title") || "Interactive demo",
        }
      }

      const iframe =
        element.querySelector?.("iframe.sl-demo") ||
        element.querySelector?.("iframe")
      if (iframe) {
        const src = iframe.getAttribute("src") || ""
        const normalized = normalizeStorylaneEmbedUrl(src)
        if (!normalized) return undefined
        return {
          demoUrl: normalized,
          title: iframe.getAttribute("title") || "Interactive demo",
        }
      }

      return undefined
    },
    render: (props) => {
      const { canEdit } = useCourseDocAccess()
      const blockProps = props.block.props as Record<string, unknown>
      const stored = readStoredDemoUrl(blockProps)
      const title =
        (typeof props.block.props.title === "string" &&
          props.block.props.title.trim()) ||
        "Interactive demo"

      const [draftUrl, setDraftUrl] = useState(
        typeof blockProps.demoUrl === "string" && blockProps.demoUrl
          ? blockProps.demoUrl
          : stored
      )
      const [draftTitle, setDraftTitle] = useState(title)
      // Defer iframe mount in edit mode — Storylane load steals focus and closes the slash menu.
      const [previewArmed, setPreviewArmed] = useState(false)

      useEffect(() => {
        setDraftUrl(
          typeof blockProps.demoUrl === "string" && blockProps.demoUrl
            ? blockProps.demoUrl
            : stored
        )
      }, [stored, blockProps.demoUrl])

      useEffect(() => {
        setDraftTitle(title)
      }, [title])

      useEffect(() => {
        setPreviewArmed(false)
      }, [stored])

      const persist = (nextUrl: string, nextTitle: string) => {
        const normalized = normalizeStorylaneEmbedUrl(nextUrl) || nextUrl.trim()
        props.editor.updateBlock(props.block, {
          type: "storylaneEmbed",
          props: {
            demoUrl: normalized,
            title: nextTitle.trim() || "Interactive demo",
          },
        })
        return normalized
      }

      // Persist as soon as input looks like a Storylane URL (don't wait for blur/Save)
      useEffect(() => {
        if (!canEdit) return
        const normalized = normalizeStorylaneEmbedUrl(draftUrl)
        if (!normalized) return
        if (normalized === stored) return
        props.editor.updateBlock(props.block, {
          type: "storylaneEmbed",
          props: {
            demoUrl: normalized,
            title: draftTitle.trim() || "Interactive demo",
          },
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when draft URL becomes valid
      }, [draftUrl, canEdit])

      if (canEdit) {
        const previewSrc =
          normalizeStorylaneEmbedUrl(draftUrl) ||
          normalizeStorylaneEmbedUrl(stored) ||
          null

        return (
          <div
            className="bn-storylane-embed bn-storylane-embed--editing"
            contentEditable={false}
          >
            <div className="bn-storylane-embed__header">
              <i className="ri-play-circle-line" aria-hidden />
              <strong>Storylane demo</strong>
            </div>
            <p className="bn-storylane-embed__hint">
              Paste a <strong>share</strong> link (
              <code>demo.storylane.com/share/…</code>), a <strong>demo</strong>{" "}
              link, or Storylane&apos;s embed HTML. Preview updates automatically —
              then click <strong>Save</strong>.
            </p>
            <label className="bn-storylane-embed__label">
              Storylane URL or embed code
              <textarea
                className="bn-storylane-embed__input bn-storylane-embed__textarea form-control"
                rows={3}
                value={draftUrl}
                placeholder="https://demo.storylane.com/share/jxz6ggkckcfx"
                onChange={(e) => setDraftUrl(e.target.value)}
                onBlur={() => {
                  const normalized = persist(draftUrl, draftTitle)
                  setDraftUrl(normalized)
                }}
              />
            </label>
            <label className="bn-storylane-embed__label">
              Title (optional)
              <input
                type="text"
                className="bn-storylane-embed__input form-control"
                value={draftTitle}
                placeholder="Interactive demo"
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={() => persist(draftUrl, draftTitle)}
              />
            </label>
            {previewSrc ? (
              <div className="bn-storylane-embed__preview">
                <p className="bn-storylane-embed__resolved small mb-2">
                  Preview using: <code>{previewSrc}</code>
                </p>
                {previewArmed ? (
                  <StorylaneEmbed src={previewSrc} title={draftTitle || title} />
                ) : (
                  <div className="bn-storylane-embed__preview-placeholder">
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
              <p className="bn-storylane-embed__empty-preview">
                No preview yet — paste{" "}
                <code>https://demo.storylane.com/share/jxz6ggkckcfx</code> or the
                full embed HTML (we read the iframe URL, not the script tag).
              </p>
            )}
          </div>
        )
      }

      // Readers (free or paid): always show embed or a clear empty state
      if (!stored) {
        return (
          <div className="bn-storylane-embed bn-storylane-embed--missing">
            Storylane demo is not configured for this lesson yet.
          </div>
        )
      }

      return (
        <div className="bn-storylane-embed bn-storylane-embed--reader">
          <StorylaneEmbed src={stored} title={title} />
        </div>
      )
    },
  }
)
