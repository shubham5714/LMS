"use client"

import React from "react"

type ListNode = {
  text: string
  children: ListNode[]
}

const LIST_ITEM_RE = /^(\s*)- (.+)$/

function parseListItem(line: string): { depth: number; text: string } | null {
  const match = line.match(LIST_ITEM_RE)
  if (!match) return null
  const depth = Math.floor(match[1].length / 2)
  return { depth, text: match[2].trim() }
}

function buildListTree(lines: string[]): ListNode[] {
  const roots: ListNode[] = []
  const stack: { depth: number; node: ListNode }[] = []

  for (const line of lines) {
    const parsed = parseListItem(line)
    if (!parsed) continue

    const node: ListNode = { text: parsed.text, children: [] }

    while (stack.length > 0 && stack[stack.length - 1].depth >= parsed.depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].node.children.push(node)
    }

    stack.push({ depth: parsed.depth, node })
  }

  return roots
}

function CourseList({
  nodes,
  nested = false,
  className = "",
}: {
  nodes: ListNode[]
  nested?: boolean
  className?: string
}) {
  return (
    <ul
      className={`course-topic-section__list mb-0${
        nested ? " course-topic-section__list--nested" : ""
      }${className ? ` ${className}` : ""}`}
    >
      {nodes.map((node, index) => (
        <li key={index}>
          {node.text}
          {node.children.length > 0 ? (
            <CourseList nodes={node.children} nested />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function renderBlock(block: string, index: number) {
  const lines = block.split("\n").map((line) => line.trimEnd())
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0)
  const listLineIndexes = nonEmptyLines.map((line) => parseListItem(line.trim()) !== null)

  const firstListIndex = listLineIndexes.findIndex(Boolean)
  const hasList = firstListIndex !== -1
  const introLines = hasList ? nonEmptyLines.slice(0, firstListIndex) : nonEmptyLines
  const listLines = hasList
    ? nonEmptyLines.slice(firstListIndex).map((line) => line.trim())
    : []

  const spacingClass = index > 0 ? " mt-2" : ""

  if (hasList && listLineIndexes.slice(firstListIndex).every(Boolean)) {
    return (
      <div key={index} className={`course-topic-section__block mb-0${spacingClass}`}>
        {introLines.map((line, lineIndex) => (
          <p
            key={lineIndex}
            className={`course-topic-section__body mb-0${lineIndex > 0 ? " mt-2" : ""}`}
          >
            {line}
          </p>
        ))}
        <CourseList
          nodes={buildListTree(listLines)}
          className={introLines.length > 0 ? "mt-2" : ""}
        />
      </div>
    )
  }

  return (
    <p key={index} className={`course-topic-section__body mb-0${spacingClass}`}>
      {nonEmptyLines.join(" ")}
    </p>
  )
}

type Props = {
  content: string
}

export function SectionBody({ content }: Props) {
  const blocks = content.split(/\n\n+/).filter(Boolean)

  return <>{blocks.map((block, index) => renderBlock(block, index))}</>
}
