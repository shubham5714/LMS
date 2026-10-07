"""
LMS Courses MCP server (FastMCP) for Prefect Horizon and local clients.

Wraps the LMS Next.js course APIs. Auth to LMS uses LMS_MCP_TOKEN.
Horizon (or local MCP clients) authenticate separately to this server.
"""

from __future__ import annotations

import json
import os
from typing import Any

import httpx
from fastmcp import FastMCP

mcp = FastMCP("LMS Courses")

FREE_BLOCKS_EXAMPLE = [
    {
        "type": "heading",
        "props": {"level": 2},
        "content": [{"type": "text", "text": "Introduction", "styles": {}}],
    },
    {
        "type": "paragraph",
        "content": [
            {
                "type": "text",
                "text": "Lesson body goes here.",
                "styles": {},
            }
        ],
    },
    {
        "type": "bulletListItem",
        "content": [{"type": "text", "text": "Key point one", "styles": {}}],
    },
    {
        "type": "codeBlock",
        "props": {"language": "bash"},
        "content": "echo hello",
    },
    {
        "type": "youtubeEmbed",
        "props": {
            "videoUrl": "https://www.youtube.com/watch?v=example",
            "title": "Overview video",
        },
    },
]

FREE_BLOCKS_EXAMPLE_JSON = json.dumps(FREE_BLOCKS_EXAMPLE, indent=2)

ALLOWED_BLOCK_TYPES = (
    "heading, paragraph, bulletListItem, numberedListItem, checkListItem, "
    "codeBlock, image, youtubeEmbed, storylaneEmbed, quote, divider. "
    "Do NOT emit premiumStart, premiumEnd, or premiumGate."
)


def _base_url() -> str:
    url = (os.environ.get("LMS_BASE_URL") or "").rstrip("/")
    if not url:
        raise RuntimeError(
            "LMS_BASE_URL is not set (e.g. https://your-lms.example.com or http://localhost:3000)"
        )
    return url


def _headers() -> dict[str, str]:
    token = (os.environ.get("LMS_MCP_TOKEN") or "").strip()
    if not token:
        raise RuntimeError("LMS_MCP_TOKEN is not set")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _request(
    method: str,
    path: str,
    *,
    json_body: Any | None = None,
    params: dict[str, str] | None = None,
) -> Any:
    url = f"{_base_url()}{path}"
    with httpx.Client(timeout=60.0) as client:
        response = client.request(
            method,
            url,
            headers=_headers(),
            json=json_body,
            params=params,
        )
    try:
        data = response.json()
    except Exception:
        data = {"raw": response.text}
    if response.status_code >= 400:
        return {
            "ok": False,
            "status": response.status_code,
            "error": data,
        }
    if isinstance(data, dict):
        return {"ok": True, **data}
    return {"ok": True, "data": data}


@mcp.tool
def list_courses() -> dict[str, Any]:
    """List all courses (including unpublished). Returns catalog + raw rows."""
    return _request("GET", "/api/courses")


@mcp.tool
def get_course(course_id: str) -> dict[str, Any]:
    """Get one course and its topics by course id slug (e.g. soc-fundamentals)."""
    return _request("GET", f"/api/courses/{course_id}")


@mcp.tool
def create_course(
    title: str,
    description: str = "",
    course_id: str | None = None,
    focus_area: str = "Security Operations",
    skill_level: str = "Beginner",
    icon: str = "ri-book-open-line",
    students_label: str = "0 students",
    duration_hours: int = 0,
    modules: int = 0,
    lessons: int = 0,
    instructor_name: str = "SOC Academy",
    overview_title: str = "Overview",
) -> dict[str, Any]:
    """
    Create an unpublished course with an overview topic.
    MCP creates are always unpublished for human review in /courses/manage.
    course_id is a URL slug; if omitted it is derived from title.
    """
    body: dict[str, Any] = {
        "title": title,
        "description": description,
        "focusArea": focus_area,
        "skillLevel": skill_level,
        "icon": icon,
        "studentsLabel": students_label,
        "durationHours": duration_hours,
        "modules": modules,
        "lessons": lessons,
        "instructorName": instructor_name,
        "overviewTitle": overview_title,
        "published": False,
    }
    if course_id:
        body["id"] = course_id
    return _request("POST", "/api/courses", json_body=body)


@mcp.tool
def list_topics(course_id: str) -> dict[str, Any]:
    """List topics for a course (sidebar order)."""
    return _request("GET", f"/api/courses/{course_id}/topics")


@mcp.tool
def create_topic(
    course_id: str,
    title: str,
    topic_id: str | None = None,
    paid_only: bool = False,
    sort_order: int | None = None,
) -> dict[str, Any]:
    """
    Add a topic under a course. topic_id is a URL slug; derived from title if omitted.
    Creates a starter lesson document automatically.
    """
    body: dict[str, Any] = {
        "title": title,
        "paidOnly": paid_only,
    }
    if topic_id:
        body["topicId"] = topic_id
    if sort_order is not None:
        body["sortOrder"] = sort_order
    return _request("POST", f"/api/courses/{course_id}/topics", json_body=body)


@mcp.tool
def update_topic(
    course_id: str,
    topic_id: str,
    title: str | None = None,
    paid_only: bool | None = None,
    sort_order: int | None = None,
) -> dict[str, Any]:
    """Update topic title, paid_only flag, or sort_order."""
    body: dict[str, Any] = {}
    if title is not None:
        body["title"] = title
    if paid_only is not None:
        body["paidOnly"] = paid_only
    if sort_order is not None:
        body["sortOrder"] = sort_order
    if not body:
        return {"ok": False, "error": "Provide at least one field to update"}
    return _request(
        "PATCH",
        f"/api/courses/{course_id}/topics/{topic_id}",
        json_body=body,
    )


@mcp.tool(
    description=(
        "Dry-run validate a free BlockNote `blocks` array (no DB write). "
        f"Allowed types: {ALLOWED_BLOCK_TYPES} "
        f"Example: {json.dumps(FREE_BLOCKS_EXAMPLE)}"
    )
)
def validate_blocks(blocks: list[dict[str, Any]]) -> dict[str, Any]:
    """Dry-run validate free BlockNote blocks before write_lesson."""
    return _request(
        "POST",
        "/api/course-topics/validate-blocks",
        json_body={"blocks": blocks},
    )


@mcp.tool(
    description=(
        "Save a lesson body as BlockNote JSON blocks for course_id/topic_id. "
        "Free content only — no premiumStart/premiumEnd/premiumGate. "
        f"Allowed types: {ALLOWED_BLOCK_TYPES} "
        f"Example blocks: {json.dumps(FREE_BLOCKS_EXAMPLE)} "
        "Prefer validate_blocks first, then write_lesson."
    )
)
def write_lesson(
    course_id: str,
    topic_id: str,
    blocks: list[dict[str, Any]],
) -> dict[str, Any]:
    """Save free BlockNote lesson content for a course topic."""
    return _request(
        "POST",
        "/api/course-topics/document",
        json_body={
            "courseId": course_id,
            "topicId": topic_id,
            "blocks": blocks,
        },
    )


@mcp.tool
def get_lesson(course_id: str, topic_id: str) -> dict[str, Any]:
    """Load the saved BlockNote document for a course topic."""
    return _request(
        "GET",
        "/api/course-topics/document",
        params={"courseId": course_id, "topicId": topic_id},
    )


@mcp.prompt
def course_authoring_playbook() -> str:
    """How to create a full unpublished course with free lesson content."""
    return f"""
You are authoring LMS courses via MCP tools. Follow this sequence exactly:

1. create_course — always unpublished (server enforces this). Include a clear title and description.
2. create_topic — add each lesson topic (overview already exists). Use stable URL slugs for topic_id.
3. For each topic: validate_blocks with free BlockNote JSON, then write_lesson.
4. Stop. Do NOT publish. A human reviews in /courses/manage and wraps premium sections manually.

BlockNote rules:
- Emit a JSON array of blocks.
- Text blocks use content: [{{"type":"text","text":"...","styles":{{}}}}]
- codeBlock content is a plain string.
- Allowed types: heading, paragraph, bulletListItem, numberedListItem, checkListItem, codeBlock, image, youtubeEmbed, storylaneEmbed, quote, divider.
- Never emit premiumStart, premiumEnd, or premiumGate.

Example free blocks:
{FREE_BLOCKS_EXAMPLE_JSON}
"""


if __name__ == "__main__":
    mcp.run()
