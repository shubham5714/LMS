"use client"

import Spkapexcharts from "@/shared/@spk-reusable-components/reusable-plugins/spk-apexcharts"
import type { SkillRadarPoint } from "@/shared/lib/skillRadar"
import type { ApexOptions } from "apexcharts"
import React, { useEffect, useMemo, useState } from "react"
import { Card, Form, Spinner } from "react-bootstrap"
import "./skills-radar.css"

type TrackOption = {
  id: string
  title: string
}

type SkillsRadarCardProps = {
  tracks: readonly TrackOption[]
  selectedTrackId: string
  onTrackChange: (trackId: string) => void
  points: readonly SkillRadarPoint[]
  loading?: boolean
  signedIn: boolean
}

export default function SkillsRadarCard({
  tracks,
  selectedTrackId,
  onTrackChange,
  points,
  loading,
  signedIn,
}: SkillsRadarCardProps) {
  const categories = useMemo(() => points.map((p) => p.skillName), [points])
  const seriesData = useMemo(() => points.map((p) => p.percent), [points])
  const chartKey = `${selectedTrackId}:${categories.join("|")}`
  const [chartReady, setChartReady] = useState(false)

  useEffect(() => {
    setChartReady(false)
  }, [chartKey, loading])

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "radar",
        toolbar: { show: false },
        fontFamily: "inherit",
        events: {
          mounted: () => setChartReady(true),
        },
      },
      colors: ["var(--primary-color)"],
      stroke: { width: 2 },
      fill: { opacity: 0 },
      markers: {
        size: 4,
        colors: ["#fff"],
        strokeColors: ["var(--primary-color)"],
        strokeWidth: 2,
        fillOpacity: 1,
        hover: { size: 6 },
      },
      xaxis: {
        categories,
        labels: {
          style: {
            colors: categories.map(() => "var(--default-text-color)"),
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 3,
        show: false,
      },
      plotOptions: {
        radar: {
          size: 160,
          polygons: {
            strokeColors: "var(--default-border)",
            connectorColors: "var(--default-border)",
          },
        },
      },
      tooltip: {
        y: { formatter: (val: number) => `${val}%` },
      },
      legend: { show: false },
    }),
    [categories]
  )

  const chartSeries = useMemo(
    () => [{ name: "Completion", data: seriesData }],
    [seriesData]
  )

  const showChart = signedIn && !loading && points.length > 0
  const showLoader = signedIn && (Boolean(loading) || (showChart && !chartReady))

  return (
    <Card className="custom-card">
      <Card.Body>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <h2 className="fs-16 fw-semibold mb-0">Your skill shape</h2>
          <Form.Group className="mb-0 d-flex align-items-center gap-2">
            <Form.Label className="small text-muted mb-0 text-nowrap">
              Career Path :
            </Form.Label>
            <Form.Select
              size="sm"
              value={selectedTrackId}
              onChange={(e) => onTrackChange(e.target.value)}
              disabled={!tracks.length || loading}
              style={{ minWidth: "10rem" }}
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>

        {!signedIn ? (
          <p className="text-muted mb-0">
            Sign in to see your skill radar based on course completions.
          </p>
        ) : !loading && points.length === 0 ? (
          <p className="text-muted mb-0">
            No skills are defined on courses in this path yet. Admins can add
            skills when creating or editing a course.
          </p>
        ) : (
          <div
            className="skills-radar-chart position-relative"
            style={{ minHeight: 420 }}
          >
            {showLoader ? (
              <div
                className="d-flex align-items-center justify-content-center position-absolute top-0 start-0 w-100 h-100"
                style={{ zIndex: 1 }}
              >
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading skill shape</span>
                </Spinner>
              </div>
            ) : null}
            {showChart ? (
              <div style={{ visibility: chartReady ? "visible" : "hidden" }}>
                <Spkapexcharts
                  key={`skills-radar-${chartKey}`}
                  chartOptions={chartOptions}
                  chartSeries={chartSeries}
                  type="radar"
                  width="100%"
                  height={420}
                />
              </div>
            ) : null}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}
