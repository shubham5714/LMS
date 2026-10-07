"use client"

import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  type BlockNoteEditor,
} from "@blocknote/core"
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from "@blocknote/react"
import type { DefaultReactSuggestionItem } from "@blocknote/react"
import React, { useCallback, useMemo } from "react"
import {
  PremiumEnd,
  PremiumGate,
  PremiumStart,
} from "./PremiumSectionMarkers"
import { StorylaneEmbedBlock } from "./StorylaneEmbedBlock"
import { YouTubeEmbedBlock } from "./YouTubeEmbedBlock"

export const courseBlockNoteSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    premiumStart: PremiumStart(),
    premiumEnd: PremiumEnd(),
    premiumGate: PremiumGate(),
    storylaneEmbed: StorylaneEmbedBlock(),
    youtubeEmbed: YouTubeEmbedBlock(),
  },
})

type CourseEditor = BlockNoteEditor<
  typeof courseBlockNoteSchema.blockSchema,
  typeof courseBlockNoteSchema.inlineContentSchema,
  typeof courseBlockNoteSchema.styleSchema
>

function insertPremiumSection(editor: CourseEditor) {
  const current = editor.getTextCursorPosition().block
  editor.insertBlocks(
    [
      {
        type: "premiumStart",
        props: { title: "Premium section", previewSrc: "" },
      },
      {
        type: "paragraph",
        content: "Add premium content here (any block types)…",
      },
      { type: "premiumEnd" },
    ],
    current,
    "after"
  )
}

function getCourseSlashMenuItems(editor: CourseEditor): DefaultReactSuggestionItem[] {
  return [
    ...getDefaultReactSlashMenuItems(editor),
    {
      title: "Premium section",
      subtext: "Wrap any blocks; FREE users see one unlock gate",
      group: "Course",
      onItemClick: () => insertPremiumSection(editor),
      aliases: ["paid", "premium", "gate"],
      badge: "P",
    },
    {
      title: "Storylane embed",
      subtext: "Interactive product demo iframe",
      group: "Course",
      onItemClick: () => {
        const current = editor.getTextCursorPosition().block
        editor.insertBlocks(
          [
            {
              type: "storylaneEmbed",
              props: {
                demoUrl: "",
                title: "Interactive demo",
              },
            },
          ],
          current,
          "after"
        )
      },
      aliases: ["storylane", "demo", "embed"],
      badge: "S",
    },
    {
      title: "YouTube video",
      subtext: "Embed a YouTube watch/share URL",
      group: "Course",
      onItemClick: () => {
        const current = editor.getTextCursorPosition().block
        editor.insertBlocks(
          [
            {
              type: "youtubeEmbed",
              props: {
                videoUrl: "",
                title: "YouTube video",
              },
            },
          ],
          current,
          "after"
        )
      },
      aliases: ["youtube", "yt", "youtu"],
      badge: "Y",
    },
  ]
}

export function CourseSlashMenu({
  editor,
  portalElement,
}: {
  editor: CourseEditor
  portalElement?: HTMLElement | null
}) {
  // Stable identity — a new getItems each render reloads the menu and can dismiss it.
  const getItems = useCallback(
    async (query: string) =>
      filterSuggestionItems(getCourseSlashMenuItems(editor), query),
    [editor]
  )

  const floatingUIOptions = useMemo(
    () => ({
      useDismissProps: {
        // Page/TOC scroll (and nested scrollables) must not close the slash menu.
        ancestorScroll: false,
      },
      elementProps: {
        style: {
          zIndex: 120,
        },
      },
    }),
    []
  )

  return (
    <SuggestionMenuController
      triggerCharacter="/"
      portalElement={portalElement ?? undefined}
      getItems={getItems}
      floatingUIOptions={floatingUIOptions}
    />
  )
}
