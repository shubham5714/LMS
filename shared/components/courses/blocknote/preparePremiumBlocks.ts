/**
 * Premium ranges are bounded by premiumStart … premiumEnd markers.
 * Editors see markers + all inner blocks.
 * Paid readers see inner blocks only (markers stripped).
 * FREE readers see a single premiumGate in place of each range.
 */

import { extractStorylaneEmbedFromUnknown } from "@/shared/courses/storylane-embed-url"

export type AnyBlock = {
  id?: string
  type?: string
  props?: Record<string, unknown>
  content?: unknown
  children?: AnyBlock[]
}

function isPremiumStart(b: AnyBlock) {
  return b.type === "premiumStart" || b.type === "paidSection"
}

function isPremiumEnd(b: AnyBlock) {
  return b.type === "premiumEnd"
}

/** Convert legacy inline paidSection blocks into start + paragraph + end. */
export function migrateLegacyPaidSections(blocks: AnyBlock[]): AnyBlock[] {
  const out: AnyBlock[] = []
  for (const block of blocks) {
    if (block.type === "paidSection") {
      const title =
        (typeof block.props?.title === "string" && block.props.title) ||
        "Premium section"
      const previewSrc =
        (typeof block.props?.previewSrc === "string" && block.props.previewSrc) ||
        ""
      out.push({
        id: block.id ? `${block.id}-start` : undefined,
        type: "premiumStart",
        props: { title, previewSrc },
      })
      if (block.content) {
        out.push({
          type: "paragraph",
          content: block.content,
        })
      } else {
        out.push({ type: "paragraph", content: "" })
      }
      out.push({
        id: block.id ? `${block.id}-end` : undefined,
        type: "premiumEnd",
      })
    } else {
      out.push(block)
    }
  }
  return out
}

/**
 * Pasting Storylane HTML into the canvas often becomes a File / code / paragraph
 * block (shows Download). Convert those into storylaneEmbed.
 */
export function migrateStorylaneLikeBlocks(blocks: AnyBlock[]): AnyBlock[] {
  const out: AnyBlock[] = []

  for (const block of blocks) {
    if (block.type === "storylaneEmbed") {
      const rawUrl =
        (typeof block.props?.demoUrl === "string" && block.props.demoUrl) ||
        (typeof block.props?.url === "string" && block.props.url) ||
        ""
      const normalized = extractStorylaneEmbedFromUnknown(rawUrl)
      out.push({
        ...block,
        props: {
          ...block.props,
          demoUrl: normalized || rawUrl,
          title:
            (typeof block.props?.title === "string" && block.props.title) ||
            "Interactive demo",
        },
      })
      continue
    }

    if (block.type === "file") {
      const fromUrl = extractStorylaneEmbedFromUnknown(block.props?.url)
      const fromName = extractStorylaneEmbedFromUnknown(block.props?.name)
      const fromCaption = extractStorylaneEmbedFromUnknown(block.props?.caption)
      const embed = fromUrl || fromName || fromCaption
      if (embed) {
        out.push({
          id: block.id,
          type: "storylaneEmbed",
          props: {
            demoUrl: embed,
            title:
              (typeof block.props?.caption === "string" && block.props.caption) ||
              (typeof block.props?.name === "string" && block.props.name) ||
              "Interactive demo",
          },
        })
        continue
      }

      // Empty file leftover from paste — drop (download-only UI)
      const fileUrl =
        typeof block.props?.url === "string" ? block.props.url.trim() : ""
      if (!fileUrl) {
        continue
      }
      out.push(block)
      continue
    }

    if (block.type === "codeBlock" || block.type === "paragraph") {
      const embed = extractStorylaneEmbedFromUnknown(block.content)
      if (embed) {
        out.push({
          id: block.id,
          type: "storylaneEmbed",
          props: { demoUrl: embed, title: "Interactive demo" },
        })
        continue
      }
    }

    out.push(block)
  }

  return out
}

function stripMarkers(blocks: AnyBlock[]): AnyBlock[] {
  return blocks.filter((b) => !isPremiumStart(b) && !isPremiumEnd(b))
}

function replaceRangesWithGate(blocks: AnyBlock[]): AnyBlock[] {
  const out: AnyBlock[] = []
  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]
    if (isPremiumStart(block)) {
      const title =
        (typeof block.props?.title === "string" && block.props.title) ||
        "Premium section"
      const previewSrc =
        (typeof block.props?.previewSrc === "string" && block.props.previewSrc) ||
        ""
      let j = i + 1
      while (j < blocks.length && !isPremiumEnd(blocks[j])) j += 1
      out.push({
        id: block.id || `premium-gate-${i}`,
        type: "premiumGate",
        props: { title, previewSrc },
      })
      i = j < blocks.length && isPremiumEnd(blocks[j]) ? j + 1 : j
      continue
    }
    if (isPremiumEnd(block)) {
      i += 1
      continue
    }
    out.push(block)
    i += 1
  }
  return out
}

/**
 * Prepare document for the current viewer before mounting BlockNote.
 */
export function preparePremiumBlocksForViewer(
  blocks: AnyBlock[],
  opts: { canEdit: boolean; hasPaidAccess: boolean }
): AnyBlock[] {
  const migrated = migrateStorylaneLikeBlocks(migrateLegacyPaidSections(blocks))
  if (opts.canEdit) return migrated
  if (opts.hasPaidAccess) return stripMarkers(migrated)
  return replaceRangesWithGate(migrated)
}
