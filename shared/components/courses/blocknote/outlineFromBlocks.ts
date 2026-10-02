import type { CourseOutlineSection } from "@/shared/components/courses/TopicOnPageNav"

type InlineText = { type?: string; text?: string; content?: InlineText[] }

type OutlineBlock = {
  id?: string
  type?: string
  props?: Record<string, unknown>
  content?: string | InlineText[]
  children?: OutlineBlock[]
}

function inlineToPlainText(content: OutlineBlock["content"]): string {
  if (content == null) return ""
  if (typeof content === "string") return content
  return content
    .map((n) => {
      if (typeof n === "string") return n
      if (n.text) return n.text
      if (n.content) return inlineToPlainText(n.content)
      return ""
    })
    .join("")
}

/**
 * Build the “On this page” outline from BlockNote headings + premium starts/gates.
 */
export function outlineFromBlocks(
  blocks: readonly OutlineBlock[] | null | undefined
): CourseOutlineSection[] {
  if (!blocks?.length) return []

  const sections: CourseOutlineSection[] = []

  const walk = (list: readonly OutlineBlock[]) => {
    for (const block of list) {
      if (block.type === "heading") {
        const levelNum = Number(block.props?.level ?? 2)
        const title = inlineToPlainText(block.content).trim() || "Untitled"
        const id = block.id || `heading-${sections.length}`
        sections.push({
          id,
          title,
          level: levelNum >= 3 ? 1 : 0,
        })
      } else if (
        block.type === "premiumStart" ||
        block.type === "premiumGate" ||
        block.type === "paidSection"
      ) {
        const title =
          (typeof block.props?.title === "string" && block.props.title.trim()) ||
          "Premium section"
        sections.push({
          id: block.id || `premium-${sections.length}`,
          title,
          level: 0,
          paidOnly: true,
          premiumPreviewSrc:
            typeof block.props?.previewSrc === "string"
              ? block.props.previewSrc
              : undefined,
        })
      }
      if (block.children?.length) walk(block.children)
    }
  }

  walk(blocks)
  return sections
}
