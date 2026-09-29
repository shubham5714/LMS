import type { InstallationStepBlock } from "@/shared/courses/securonix-siem-config"
import React from "react"

type Props = {
  steps: readonly { id: string; title: string; blocks: readonly InstallationStepBlock[] }[]
}

function StepBlock({ block, index }: { block: InstallationStepBlock; index: number }) {
  const spacingClass = index > 0 ? " mt-2" : ""

  if (block.type === "text") {
    return (
      <p className={`course-topic-section__body mb-0${spacingClass}`}>{block.content}</p>
    )
  }

  if (block.type === "list") {
    return (
      <ul className={`course-topic-section__list mb-0${spacingClass}`}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <pre className={`course-topic-section__code mb-0${spacingClass}`}>
      <code>{block.content}</code>
    </pre>
  )
}

export function InstallationSteps({ steps }: Props) {
  return (
    <div className="course-installation-steps">
      {steps.map((step) => (
        <div key={step.id} id={step.id} className="course-installation-steps__step">
          <h3 className="course-topic-section__heading course-installation-steps__title">
            {step.title}
          </h3>
          {step.blocks.map((block, index) => (
            <StepBlock key={index} block={block} index={index} />
          ))}
        </div>
      ))}
    </div>
  )
}
