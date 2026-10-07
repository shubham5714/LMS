/**
 * Block-level edits for MCP/AI lesson updates. Edits target blocks by id so
 * human-only blocks (embeds, premium markers) are never rewritten or dropped.
 */

import {
  isHumanOnlyBlockType,
  validateFreeBlockNoteBlocks,
  type BlockValidationIssue,
} from "./blocknote-blocks-schema"

export type EditBlock = {
  id?: string
  type?: string
  props?: Record<string, unknown>
  content?: unknown
  children?: EditBlock[]
}

export type LessonEditOperation =
  | { op: "replace"; blockId: string; blocks: unknown[] }
  | { op: "insert"; afterBlockId: string; blocks: unknown[] }
  | { op: "insert"; beforeBlockId: string; blocks: unknown[] }
  | { op: "insert"; position: "start" | "end"; blocks: unknown[] }
  | { op: "delete"; blockId: string }

export type LessonEditResult =
  | { ok: true; blocks: EditBlock[]; insertedIds: string[][] }
  | {
      ok: false
      operationIndex: number
      error: string
      issues?: BlockValidationIssue[]
    }

type Location = { siblings: EditBlock[]; index: number }

function findBlock(blocks: EditBlock[], id: string): Location | null {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) return { siblings: blocks, index: i }
    const children = blocks[i].children
    if (Array.isArray(children) && children.length > 0) {
      const found = findBlock(children, id)
      if (found) return found
    }
  }
  return null
}

function containsHumanOnlyBlock(block: EditBlock): boolean {
  if (isHumanOnlyBlockType(block.type)) return true
  return (block.children ?? []).some(containsHumanOnlyBlock)
}

function collectIds(blocks: EditBlock[], into: Set<string>): void {
  for (const block of blocks) {
    if (typeof block.id === "string") into.add(block.id)
    if (Array.isArray(block.children)) collectIds(block.children, into)
  }
}

/** Give every new block a fresh unique id so later operations can target it. */
function assignIds(
  blocks: EditBlock[],
  existing: Set<string>,
  makeId: () => string
): string[] {
  const topLevelIds: string[] = []
  const visit = (list: EditBlock[], topLevel: boolean) => {
    for (const block of list) {
      let id = block.id
      if (typeof id !== "string" || !id.trim() || existing.has(id)) {
        do {
          id = makeId()
        } while (existing.has(id))
        block.id = id
      }
      existing.add(id)
      if (topLevel) topLevelIds.push(id)
      if (Array.isArray(block.children)) visit(block.children, false)
    }
  }
  visit(blocks, true)
  return topLevelIds
}

function describeOp(op: LessonEditOperation): string {
  if (op.op === "insert") {
    if ("afterBlockId" in op) return `insert after ${op.afterBlockId}`
    if ("beforeBlockId" in op) return `insert before ${op.beforeBlockId}`
    return `insert at ${op.position}`
  }
  return `${op.op} ${op.blockId}`
}

/**
 * Apply operations in order to a copy of the document. All-or-nothing:
 * the first failing operation aborts and nothing is returned for saving.
 */
export function applyLessonEdits(
  document: unknown[],
  operations: unknown,
  makeId: () => string = () => crypto.randomUUID()
): LessonEditResult {
  if (!Array.isArray(operations) || operations.length === 0) {
    return {
      ok: false,
      operationIndex: -1,
      error: "operations must be a non-empty array",
    }
  }

  const blocks = structuredClone(document) as EditBlock[]
  const ids = new Set<string>()
  collectIds(blocks, ids)
  const insertedIds: string[][] = []

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i] as LessonEditOperation
    const fail = (error: string, issues?: BlockValidationIssue[]) =>
      ({ ok: false, operationIndex: i, error, issues }) as const

    if (!op || typeof op !== "object" || !("op" in op)) {
      return fail("operation must be an object with an `op` field")
    }

    let newBlocks: EditBlock[] = []
    if (op.op === "replace" || op.op === "insert") {
      const validation = validateFreeBlockNoteBlocks(op.blocks)
      if ("issues" in validation) {
        return fail(`${describeOp(op)}: invalid blocks`, validation.issues)
      }
      if (op.blocks.length === 0) {
        return fail(`${describeOp(op)}: blocks must not be empty (use delete instead)`)
      }
      newBlocks = structuredClone(op.blocks) as EditBlock[]
    }

    if (op.op === "replace" || op.op === "delete") {
      if (typeof op.blockId !== "string" || !op.blockId) {
        return fail(`${op.op}: blockId is required`)
      }
      const loc = findBlock(blocks, op.blockId)
      if (!loc) return fail(`${describeOp(op)}: block not found`)
      if (containsHumanOnlyBlock(loc.siblings[loc.index])) {
        return fail(
          `${describeOp(op)}: block is (or contains) a human-managed block ` +
            "(YouTube, Storylane, or premium marker) and cannot be changed by AI"
        )
      }
      if (op.op === "delete") {
        loc.siblings.splice(loc.index, 1)
        insertedIds.push([])
      } else {
        insertedIds.push(assignIds(newBlocks, ids, makeId))
        loc.siblings.splice(loc.index, 1, ...newBlocks)
      }
      continue
    }

    if (op.op === "insert") {
      let siblings: EditBlock[]
      let index: number
      if ("afterBlockId" in op || "beforeBlockId" in op) {
        const anchorId = "afterBlockId" in op ? op.afterBlockId : op.beforeBlockId
        const loc = findBlock(blocks, anchorId)
        if (!loc) return fail(`${describeOp(op)}: anchor block not found`)
        siblings = loc.siblings
        index = "afterBlockId" in op ? loc.index + 1 : loc.index
      } else if (op.position === "start" || op.position === "end") {
        siblings = blocks
        index = op.position === "start" ? 0 : blocks.length
      } else {
        return fail(
          "insert: provide afterBlockId, beforeBlockId, or position ('start' | 'end')"
        )
      }
      insertedIds.push(assignIds(newBlocks, ids, makeId))
      siblings.splice(index, 0, ...newBlocks)
      continue
    }

    return fail(`unknown op "${(op as { op: unknown }).op}"; use replace, insert, or delete`)
  }

  return { ok: true, blocks, insertedIds }
}

export function documentHasHumanOnlyBlocks(document: unknown[]): boolean {
  return (document as EditBlock[]).some(containsHumanOnlyBlock)
}
