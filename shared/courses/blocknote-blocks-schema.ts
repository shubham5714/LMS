/**
 * Free-content BlockNote allowlist for MCP / AI course authoring.
 * Premium markers are rejected so humans gate paid sections in the editor.
 */

export const FREE_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "codeBlock",
  "image",
  "youtubeEmbed",
  "storylaneEmbed",
  // Common BlockNote defaults agents may emit
  "quote",
  "divider",
] as const

export type FreeBlockType = (typeof FREE_BLOCK_TYPES)[number]

export const PREMIUM_BLOCK_TYPES = [
  "premiumStart",
  "premiumEnd",
  "premiumGate",
] as const

const FREE_SET = new Set<string>(FREE_BLOCK_TYPES)
const PREMIUM_SET = new Set<string>(PREMIUM_BLOCK_TYPES)

const TEXT_CONTENT_TYPES = new Set([
  "heading",
  "paragraph",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "quote",
])

export type BlockValidationIssue = {
  path: string
  message: string
}

export type BlockValidationResult =
  | { ok: true; blocks: unknown[] }
  | { ok: false; issues: BlockValidationIssue[] }

type AnyBlock = {
  id?: unknown
  type?: unknown
  props?: unknown
  content?: unknown
  children?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function validateInlineContent(
  content: unknown,
  path: string,
  issues: BlockValidationIssue[]
): void {
  if (content == null) return

  if (typeof content === "string") {
    // Some BlockNote exports use plain strings; accept for free text blocks.
    return
  }

  if (!Array.isArray(content)) {
    issues.push({
      path,
      message: "content must be a string or an array of inline nodes",
    })
    return
  }

  content.forEach((node, i) => {
    const nodePath = `${path}[${i}]`
    if (!isRecord(node)) {
      issues.push({ path: nodePath, message: "inline node must be an object" })
      return
    }
    if (node.type === "text") {
      if (typeof node.text !== "string") {
        issues.push({ path: `${nodePath}.text`, message: "text must be a string" })
      }
      if (node.styles != null && !isRecord(node.styles)) {
        issues.push({
          path: `${nodePath}.styles`,
          message: "styles must be an object",
        })
      }
      return
    }
    if (node.type === "link") {
      if (typeof node.href !== "string") {
        issues.push({ path: `${nodePath}.href`, message: "href must be a string" })
      }
      validateInlineContent(node.content, `${nodePath}.content`, issues)
      return
    }
    // Allow other inline types (mentions, etc.) without deep validation
  })
}

function validateBlock(
  block: unknown,
  path: string,
  issues: BlockValidationIssue[]
): void {
  if (!isRecord(block)) {
    issues.push({ path, message: "block must be an object" })
    return
  }

  const typed = block as AnyBlock
  if (typeof typed.type !== "string" || !typed.type.trim()) {
    issues.push({ path: `${path}.type`, message: "type is required" })
    return
  }

  const type = typed.type

  if (PREMIUM_SET.has(type)) {
    issues.push({
      path: `${path}.type`,
      message: `${type} is not allowed for MCP/AI free content; wrap premium sections manually in the editor`,
    })
    return
  }

  if (!FREE_SET.has(type)) {
    issues.push({
      path: `${path}.type`,
      message: `unsupported block type "${type}". Allowed: ${FREE_BLOCK_TYPES.join(", ")}`,
    })
    return
  }

  if (typed.props != null && !isRecord(typed.props)) {
    issues.push({ path: `${path}.props`, message: "props must be an object" })
  }

  if (type === "codeBlock") {
    if (
      typed.content != null &&
      typeof typed.content !== "string" &&
      !Array.isArray(typed.content)
    ) {
      issues.push({
        path: `${path}.content`,
        message: "codeBlock content must be a string or inline array",
      })
    }
  } else if (TEXT_CONTENT_TYPES.has(type)) {
    validateInlineContent(typed.content, `${path}.content`, issues)
  }

  if (type === "heading") {
    const level = isRecord(typed.props) ? typed.props.level : undefined
    if (
      level != null &&
      (typeof level !== "number" || level < 1 || level > 6)
    ) {
      issues.push({
        path: `${path}.props.level`,
        message: "heading level must be 1–6",
      })
    }
  }

  if (type === "youtubeEmbed") {
    const props = isRecord(typed.props) ? typed.props : {}
    const videoUrl = props.videoUrl ?? props.url
    if (videoUrl != null && typeof videoUrl !== "string") {
      issues.push({
        path: `${path}.props.videoUrl`,
        message: "videoUrl must be a string",
      })
    }
  }

  if (type === "storylaneEmbed") {
    const props = isRecord(typed.props) ? typed.props : {}
    const demoUrl = props.demoUrl ?? props.url
    if (demoUrl != null && typeof demoUrl !== "string") {
      issues.push({
        path: `${path}.props.demoUrl`,
        message: "demoUrl must be a string",
      })
    }
  }

  if (type === "image") {
    const props = isRecord(typed.props) ? typed.props : {}
    if (props.url != null && typeof props.url !== "string") {
      issues.push({ path: `${path}.props.url`, message: "url must be a string" })
    }
  }

  if (typed.children != null) {
    if (!Array.isArray(typed.children)) {
      issues.push({
        path: `${path}.children`,
        message: "children must be an array",
      })
    } else {
      typed.children.forEach((child, i) => {
        validateBlock(child, `${path}.children[${i}]`, issues)
      })
    }
  }
}

/**
 * Validate a BlockNote document for free MCP/AI authoring.
 * Does not mutate blocks; callers may normalize embeds separately on save.
 */
export function validateFreeBlockNoteBlocks(
  blocks: unknown
): BlockValidationResult {
  if (!Array.isArray(blocks)) {
    return {
      ok: false,
      issues: [{ path: "blocks", message: "blocks must be a JSON array" }],
    }
  }

  const issues: BlockValidationIssue[] = []
  blocks.forEach((block, i) => {
    validateBlock(block, `blocks[${i}]`, issues)
  })

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true, blocks }
}

/** Short example for MCP tool descriptions. */
export const FREE_BLOCKS_EXAMPLE = [
  {
    type: "heading",
    props: { level: 2 },
    content: [{ type: "text", text: "Introduction", styles: {} }],
  },
  {
    type: "paragraph",
    content: [
      {
        type: "text",
        text: "Lesson body goes here.",
        styles: {},
      },
    ],
  },
  {
    type: "bulletListItem",
    content: [{ type: "text", text: "Key point one", styles: {} }],
  },
  {
    type: "codeBlock",
    props: { language: "bash" },
    content: "echo hello",
  },
  {
    type: "youtubeEmbed",
    props: {
      videoUrl: "https://www.youtube.com/watch?v=example",
      title: "Overview video",
    },
  },
] as const
