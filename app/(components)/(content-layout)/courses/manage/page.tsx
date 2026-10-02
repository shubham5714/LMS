"use client"

import {
  COURSE_FOCUS_AREAS,
  COURSE_SKILL_LEVELS,
} from "@/shared/courses/catalog"
import { slugifyId, topicHref } from "@/shared/courses/course-structure"
import { useMembershipContext } from "@/shared/contextapi/MembershipContext"
import Seo from "@/shared/layouts-components/seo/seo"
import Link from "next/link"
import React, { Fragment, useCallback, useEffect, useState } from "react"
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap"

type CourseRow = {
  id: string
  title: string
  description: string
  focus_area: string
  skill_level: string
  icon: string
  published: boolean
  sort_order: number
}

type TopicRow = {
  course_id: string
  topic_id: string
  title: string
  sort_order: number
  paid_only: boolean
}

export default function ManageCoursesPage() {
  const { canEditCourseContent, isLoading: membershipLoading } =
    useMembershipContext()
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [newCourseId, setNewCourseId] = useState("")
  const [newCourseDesc, setNewCourseDesc] = useState("")
  const [newFocus, setNewFocus] = useState(COURSE_FOCUS_AREAS[0])
  const [newSkill, setNewSkill] = useState(COURSE_SKILL_LEVELS[0])

  const [newTopicTitle, setNewTopicTitle] = useState("")
  const [newTopicId, setNewTopicId] = useState("")
  const [newTopicPaid, setNewTopicPaid] = useState(false)

  const loadCourses = useCallback(async () => {
    setError(null)
    const res = await fetch("/api/courses")
    const json = (await res.json().catch(() => ({}))) as {
      error?: string
      raw?: CourseRow[]
    }
    if (!res.ok) {
      setError(json.error || "Failed to load courses")
      return
    }
    setCourses(json.raw || [])
  }, [])

  const loadTopics = useCallback(async (courseId: string) => {
    setError(null)
    const res = await fetch(`/api/courses/${courseId}/topics`)
    const json = (await res.json().catch(() => ({}))) as {
      error?: string
      topics?: TopicRow[]
    }
    if (!res.ok) {
      setError(json.error || "Failed to load topics")
      return
    }
    setTopics(json.topics || [])
  }, [])

  useEffect(() => {
    if (!canEditCourseContent) return
    void loadCourses()
  }, [canEditCourseContent, loadCourses])

  useEffect(() => {
    if (!selectedId) {
      setTopics([])
      return
    }
    void loadTopics(selectedId)
  }, [selectedId, loadTopics])

  const createCourse = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCourseTitle,
          id: newCourseId.trim() || undefined,
          description: newCourseDesc,
          focusArea: newFocus,
          skillLevel: newSkill,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; course?: CourseRow }
      if (!res.ok) throw new Error(json.error || "Create failed")
      setNewCourseTitle("")
      setNewCourseId("")
      setNewCourseDesc("")
      await loadCourses()
      if (json.course?.id) setSelectedId(json.course.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed")
    } finally {
      setBusy(false)
    }
  }

  const createTopic = async () => {
    if (!selectedId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${selectedId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTopicTitle,
          topicId: newTopicId.trim() || undefined,
          paidOnly: newTopicPaid,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Create topic failed")
      setNewTopicTitle("")
      setNewTopicId("")
      setNewTopicPaid(false)
      await loadTopics(selectedId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create topic failed")
    } finally {
      setBusy(false)
    }
  }

  const toggleTopicPaid = async (topic: TopicRow) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/courses/${topic.course_id}/topics/${topic.topic_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paidOnly: !topic.paid_only }),
        }
      )
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Update failed")
      await loadTopics(topic.course_id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusy(false)
    }
  }

  const deleteTopic = async (topic: TopicRow) => {
    if (topic.topic_id === "overview") return
    if (!window.confirm(`Delete topic “${topic.title}”?`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/courses/${topic.course_id}/topics/${topic.topic_id}`,
        { method: "DELETE" }
      )
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Delete failed")
      await loadTopics(topic.course_id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (
      !window.confirm(
        `Delete course “${courseId}” and all its topics/lessons? This cannot be undone.`
      )
    ) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Delete failed")
      if (selectedId === courseId) setSelectedId(null)
      await loadCourses()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  if (membershipLoading) {
    return <p className="text-muted">Loading…</p>
  }

  if (!canEditCourseContent) {
    return (
      <Fragment>
        <Seo title="Manage courses" />
        <Card className="custom-card">
          <Card.Body>
            <h1 className="h5">Admin only</h1>
            <p className="text-muted mb-0">
              Your membership must be ADMIN to create courses and topics.
            </p>
          </Card.Body>
        </Card>
      </Fragment>
    )
  }

  const selected = courses.find((c) => c.id === selectedId) || null

  return (
    <Fragment>
      <Seo title="Manage courses" />
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="page-title fw-medium fs-18 mb-0">Manage courses</h1>
          <p className="text-muted mb-0 mt-1">
            Create courses and left-sidebar topics. Lesson bodies are edited in
            BlockNote on each topic page.
          </p>
        </div>
        <Link href="/courses" className="btn btn-sm btn-outline-secondary">
          Back to catalog
        </Link>
      </div>

      {error ? <p className="text-danger small">{error}</p> : null}

      <Row className="g-4">
        <Col lg={5}>
          <Card className="custom-card mb-4">
            <Card.Header>
              <Card.Title className="mb-0">New course</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={newCourseTitle}
                  onChange={(e) => {
                    setNewCourseTitle(e.target.value)
                    if (!newCourseId) setNewCourseId(slugifyId(e.target.value))
                  }}
                  placeholder="Cloud Detection Basics"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>URL id (slug)</Form.Label>
                <Form.Control
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(slugifyId(e.target.value))}
                  placeholder="cloud-detection-basics"
                />
                <Form.Text muted>
                  Path will be /courses/{newCourseId || "your-slug"}
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                />
              </Form.Group>
              <Row className="g-2 mb-3">
                <Col>
                  <Form.Label>Focus</Form.Label>
                  <Form.Select
                    value={newFocus}
                    onChange={(e) => setNewFocus(e.target.value as typeof newFocus)}
                  >
                    {COURSE_FOCUS_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Label>Skill</Form.Label>
                  <Form.Select
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value as typeof newSkill)}
                  >
                    {COURSE_SKILL_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
              <Button
                variant="primary"
                disabled={busy || !newCourseTitle.trim()}
                onClick={() => void createCourse()}
              >
                Create course
              </Button>
            </Card.Body>
          </Card>

          <Card className="custom-card">
            <Card.Header>
              <Card.Title className="mb-0">Courses</Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr
                      key={c.id}
                      className={selectedId === c.id ? "table-active" : undefined}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <td>
                        <div className="fw-semibold">{c.title}</div>
                        <div className="small text-muted">{c.id}</div>
                      </td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation()
                            void deleteCourse(c.id)
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="custom-card">
            <Card.Header>
              <Card.Title className="mb-0">
                {selected
                  ? `Topics · ${selected.title}`
                  : "Select a course to manage topics"}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {!selected ? (
                <p className="text-muted mb-0">
                  Pick a course on the left. Topics appear in the left sidebar
                  when learners open the course.
                </p>
              ) : (
                <>
                  <div className="mb-3 d-flex flex-wrap gap-2">
                    <Link
                      href={`/courses/${selected.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Open overview lesson
                    </Link>
                  </div>

                  <Form className="border rounded p-3 mb-4">
                    <div className="fw-semibold mb-2">Add topic</div>
                    <Row className="g-2 align-items-end">
                      <Col md={5}>
                        <Form.Label className="small mb-1">Title</Form.Label>
                        <Form.Control
                          size="sm"
                          value={newTopicTitle}
                          onChange={(e) => {
                            setNewTopicTitle(e.target.value)
                            if (!newTopicId)
                              setNewTopicId(slugifyId(e.target.value))
                          }}
                          placeholder="Incident Response"
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small mb-1">Slug</Form.Label>
                        <Form.Control
                          size="sm"
                          value={newTopicId}
                          onChange={(e) =>
                            setNewTopicId(slugifyId(e.target.value))
                          }
                          placeholder="incident-response"
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Check
                          type="checkbox"
                          id="new-topic-paid"
                          label="Paid only"
                          checked={newTopicPaid}
                          onChange={(e) => setNewTopicPaid(e.target.checked)}
                        />
                      </Col>
                    </Row>
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="primary"
                      disabled={busy || !newTopicTitle.trim()}
                      onClick={() => void createTopic()}
                    >
                      Add topic
                    </Button>
                  </Form>

                  <Table hover responsive className="align-middle">
                    <thead>
                      <tr>
                        <th>Topic</th>
                        <th>Paid</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {topics.map((t) => (
                        <tr key={t.topic_id}>
                          <td>
                            <Link href={topicHref(selected.id, t.topic_id)}>
                              {t.title}
                            </Link>
                            <div className="small text-muted">{t.topic_id}</div>
                          </td>
                          <td>
                            <Form.Check
                              type="switch"
                              checked={t.paid_only}
                              disabled={busy}
                              onChange={() => void toggleTopicPaid(t)}
                              aria-label="Paid only"
                            />
                          </td>
                          <td className="text-end">
                            <Link
                              href={topicHref(selected.id, t.topic_id)}
                              className="btn btn-sm btn-outline-secondary me-2"
                            >
                              Edit lesson
                            </Link>
                            {t.topic_id !== "overview" ? (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                disabled={busy}
                                onClick={() => void deleteTopic(t)}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  )
}
