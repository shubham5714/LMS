"use client"

import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import { BlockNoteView } from "@blocknote/mantine"
import { useCreateBlockNote } from "@blocknote/react"
import { MantineProvider } from "@mantine/core"
import { CourseDocAccessProvider } from "@/shared/components/courses/blocknote/CourseDocAccessContext"
import {
  CourseSlashMenu,
  courseBlockNoteSchema,
} from "@/shared/components/courses/blocknote/courseBlockNoteSchema"
import { outlineFromBlocks } from "@/shared/components/courses/blocknote/outlineFromBlocks"
import { preparePremiumBlocksForViewer } from "@/shared/components/courses/blocknote/preparePremiumBlocks"
import { TopicOnPageNav } from "@/shared/components/courses/TopicOnPageNav"
import { useActiveOutlineSection } from "@/shared/hooks/useActiveOutlineSection"
import { useReadingProgress } from "@/shared/hooks/useReadingProgress"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

function subscribeHtmlThemeMode(onChange: () => void) {
  const root = document.documentElement
  const obs = new MutationObserver(onChange)
  obs.observe(root, { attributes: true, attributeFilter: ["data-theme-mode"] })
  return () => obs.disconnect()
}

function getIsDarkThemeMode(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.getAttribute("data-theme-mode") === "dark"
}

function useIsDarkThemeMode(): boolean {
  return useSyncExternalStore(subscribeHtmlThemeMode, getIsDarkThemeMode, () => false)
}

export type CourseTopicDocumentEditorProps = {
  courseId: string
  topicId: string
  topicTitle: string
  initialBlocks: unknown[]
  canEdit: boolean
  hasPaidAccess: boolean
  seoSlot?: React.ReactNode
  loadError: string | null
  dirty: boolean
  setDirty: (v: boolean) => void
  saveState: "idle" | "saving" | "saved" | "error"
  setSaveState: (v: "idle" | "saving" | "saved" | "error") => void
  saveError: string | null
  setSaveError: (v: string | null) => void
}

export default function CourseTopicDocumentEditor({
  courseId,
  topicId,
  topicTitle,
  initialBlocks,
  canEdit,
  hasPaidAccess,
  seoSlot,
  loadError,
  dirty,
  setDirty,
  saveState,
  setSaveState,
  saveError,
  setSaveError,
}: CourseTopicDocumentEditorProps) {
  const isDark = useIsDarkThemeMode()
  const bnTheme = isDark ? "dark" : "light"
  // Resolve on first client render so portal target does not flip null → node mid-edit.
  const [portalRoot] = useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null
    let root = document.getElementById("bn-course-portal-root")
    if (!root) {
      root = document.createElement("div")
      root.id = "bn-course-portal-root"
      document.body.appendChild(root)
    }
    return root
  })

  const viewerBlocks = useMemo(
    () =>
      preparePremiumBlocksForViewer(initialBlocks as Parameters<
        typeof preparePremiumBlocksForViewer
      >[0], {
        canEdit,
        hasPaidAccess,
      }),
    [initialBlocks, canEdit, hasPaidAccess]
  )

  const uploadFile = useCallback(
    async (file: File) => {
      const body = new FormData()
      body.set("file", file)
      body.set("courseId", courseId)
      body.set("topicId", topicId)
      const res = await fetch("/api/courses/images", {
        method: "POST",
        body,
      })
      const json = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
      }
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Image upload failed")
      }
      return json.url
    },
    [courseId, topicId]
  )

  const editor = useCreateBlockNote({
    schema: courseBlockNoteSchema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialContent: viewerBlocks as any,
    uploadFile: canEdit ? uploadFile : undefined,
  })

  const [outlineBlocks, setOutlineBlocks] = useState(viewerBlocks)
  const sections = useMemo(
    () =>
      outlineFromBlocks(
        outlineBlocks as Parameters<typeof outlineFromBlocks>[0]
      ),
    [outlineBlocks]
  )
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections])
  const readingPercent = useReadingProgress()
  const activeSectionId = useActiveOutlineSection(sectionIds, 110)

  useEffect(() => {
    for (const id of sectionIds) {
      const el = document.querySelector(
        `[data-id="${CSS.escape(id)}"]`
      ) as HTMLElement | null
      if (el && !el.id) {
        el.id = id
        el.style.scrollMarginTop = "6.5rem"
      }
    }
  }, [sectionIds])

  const outlineUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (outlineUpdateTimer.current) clearTimeout(outlineUpdateTimer.current)
    }
  }, [])

  const onChange = useCallback(() => {
    setDirty(true)
    setSaveState("idle")
    // Debounce TOC updates so typing "/" / scrolling the slash menu does not
    // thrash React state and remount floating UI.
    if (outlineUpdateTimer.current) clearTimeout(outlineUpdateTimer.current)
    outlineUpdateTimer.current = setTimeout(() => {
      setOutlineBlocks(editor.document as unknown[])
    }, 400)
  }, [editor, setDirty, setSaveState])

  const save = useCallback(async () => {
    if (!canEdit) return
    setSaveState("saving")
    setSaveError(null)
    try {
      const res = await fetch("/api/course-topics/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          topicId,
          blocks: editor.document,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      if (!res.ok) {
        throw new Error(json.error || `Save failed (${res.status})`)
      }
      setDirty(false)
      setSaveState("saved")
    } catch (e) {
      setSaveState("error")
      setSaveError(e instanceof Error ? e.message : "Save failed")
    }
  }, [canEdit, courseId, topicId, editor, setDirty, setSaveState, setSaveError])

  return (
    <>
      {seoSlot}
      <div className="soc-fundamentals-topic course-topic-lesson">
        <div className="soc-fundamentals-topic-layout">
          <div className="soc-fundamentals-topic-main">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <h1 className="course-topic-lesson__title mb-0">{topicTitle}</h1>
              {canEdit ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={saveState === "saving" || !dirty}
                  onClick={() => void save()}
                >
                  {saveState === "saving" ? "Saving…" : "Save"}
                </button>
              ) : null}
            </div>
            {canEdit && saveState === "saved" ? (
              <p className="text-success small">Saved</p>
            ) : null}
            {canEdit && saveState === "error" && saveError ? (
              <p className="text-danger small">{saveError}</p>
            ) : null}
            {loadError ? (
              <p className="text-muted small">
                Using local seed content ({loadError})
              </p>
            ) : null}

            <CourseDocAccessProvider
              hasPaidAccess={hasPaidAccess}
              canEdit={canEdit}
            >
              <div className="course-blocknote-editor">
                <MantineProvider forceColorScheme={bnTheme}>
                  <BlockNoteView
                    editor={editor}
                    editable={canEdit}
                    theme={bnTheme}
                    slashMenu={false}
                    onChange={onChange}
                    portalElements={
                      portalRoot ? { default: portalRoot } : undefined
                    }
                  >
                    {canEdit ? (
                      <CourseSlashMenu editor={editor} portalElement={portalRoot} />
                    ) : null}
                  </BlockNoteView>
                </MantineProvider>
              </div>
            </CourseDocAccessProvider>
          </div>

          {sections.length > 0 ? (
            <aside className="soc-fundamentals-topic-toc" aria-label="On this page">
              <div className="soc-fundamentals-topic-toc-inner">
                <TopicOnPageNav
                  sections={sections}
                  activeSectionId={activeSectionId}
                  readingPercent={readingPercent}
                  hasPaidAccess={hasPaidAccess}
                />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  )
}
