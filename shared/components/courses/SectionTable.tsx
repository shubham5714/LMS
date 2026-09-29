import React from "react"
import type { SecuronixSectionTable } from "@/shared/courses/securonix-siem-config"

type Props = {
  table: SecuronixSectionTable
}

export function SectionTable({ table }: Props) {
  return (
    <div className="course-topic-section__table-wrap">
      <div className="table-responsive">
        <table className="table table-bordered mb-0 course-topic-section__table">
          <thead>
            <tr>
              {table.headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.footerNote ? (
        <p className="course-topic-section__body mb-0 mt-2">{table.footerNote}</p>
      ) : null}
    </div>
  )
}
