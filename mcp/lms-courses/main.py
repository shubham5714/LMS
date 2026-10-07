"""
LMS Courses MCP server (FastMCP) for Prefect Horizon and local clients.

Wraps the LMS Next.js course APIs. Auth to LMS uses LMS_MCP_TOKEN.
Horizon (or local MCP clients) authenticate separately to this server.
"""

from __future__ import annotations

import ipaddress
import json
import os
import re
import socket
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
import trafilatura
from fastmcp import FastMCP

mcp = FastMCP("LMS Courses")

FREE_BLOCKS_EXAMPLE = [
    {
        "type": "heading",
        "props": {"level": 3},
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
]

FREE_BLOCKS_EXAMPLE_JSON = json.dumps(FREE_BLOCKS_EXAMPLE, indent=2)

ALLOWED_BLOCK_TYPES = (
    "heading, paragraph, bulletListItem, numberedListItem, checkListItem, "
    "codeBlock, image, quote, divider. "
    "Do NOT emit youtubeEmbed, storylaneEmbed, premiumStart, premiumEnd, or premiumGate "
    "(add those manually in the editor)."
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


def _api_path(path: str) -> str:
    """Next.js is configured with trailingSlash: true — avoid 308 redirects."""
    if not path.startswith("/"):
        path = f"/{path}"
    if "?" in path:
        base, query = path.split("?", 1)
        base = base if base.endswith("/") else f"{base}/"
        return f"{base}?{query}"
    return path if path.endswith("/") else f"{path}/"


def _request(
    method: str,
    path: str,
    *,
    json_body: Any | None = None,
    params: dict[str, str] | None = None,
) -> Any:
    url = f"{_base_url()}{_api_path(path)}"
    with httpx.Client(timeout=60.0, follow_redirects=True) as client:
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
    # Treat leftover redirects as failure (should be rare with trailing slash + follow).
    if response.status_code >= 400 or response.is_redirect:
        return {
            "ok": False,
            "status": response.status_code,
            "error": data,
            "url": str(response.url),
        }
    if isinstance(data, dict):
        return {"ok": True, **data}
    return {"ok": True, "data": data}


BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"
FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 LMSCoursesResearch/1.0"
    ),
    "Accept": "text/html,application/xhtml+xml,text/plain,text/markdown,*/*;q=0.5",
    "Accept-Language": "en-US,en;q=0.9",
}
FETCH_MAX_BYTES = 3_000_000
FETCH_MAX_REDIRECTS = 5
FETCH_DEFAULT_CHARS = 8_000
FETCH_MAX_CHARS = 30_000


def _assert_public_http_url(url: str) -> None:
    """Block non-HTTP schemes and private/internal hosts (this server runs hosted)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("Only absolute http(s) URLs are allowed")
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or None)
    except socket.gaierror as e:
        raise ValueError(f"Could not resolve host {parsed.hostname}") from e
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise ValueError(f"Host {parsed.hostname} resolves to a non-public address")


def _get_public(client: httpx.Client, url: str) -> tuple[httpx.Response, bytes]:
    """GET with manual redirects so every hop is checked, capped at FETCH_MAX_BYTES."""
    current = url
    for _ in range(FETCH_MAX_REDIRECTS + 1):
        _assert_public_http_url(current)
        with client.stream("GET", current) as response:
            if response.is_redirect:
                location = response.headers.get("location")
                if not location:
                    raise ValueError("Redirect without Location header")
                current = urljoin(current, location)
                continue
            body = bytearray()
            for chunk in response.iter_bytes():
                body.extend(chunk)
                if len(body) > FETCH_MAX_BYTES:
                    break
            return response, bytes(body)
    raise ValueError("Too many redirects")


def _collapse_whitespace(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


@mcp.tool
def search_web(
    query: str,
    max_results: int = 5,
    domains: list[str] | None = None,
) -> dict[str, Any]:
    """
    Search the web for research sources. Returns title, url, and snippet per result.
    Prefer official vendor documentation / knowledge-base results.
    Use `domains` to restrict to specific sites (e.g. ["docs.splunk.com"]).
    max_results is clamped to 1-10.
    """
    api_key = (os.environ.get("BRAVE_SEARCH_API_KEY") or "").strip()
    if not api_key:
        return {"ok": False, "error": "BRAVE_SEARCH_API_KEY is not set on the MCP server"}

    q = query.strip()
    if not q:
        return {"ok": False, "error": "query is required"}
    if domains:
        sites = " OR ".join(f"site:{d.strip()}" for d in domains if d.strip())
        if sites:
            q = f"{q} ({sites})"

    count = max(1, min(int(max_results), 10))
    with httpx.Client(timeout=20.0) as client:
        response = client.get(
            BRAVE_SEARCH_URL,
            params={"q": q, "count": count},
            headers={
                "Accept": "application/json",
                "X-Subscription-Token": api_key,
            },
        )
    if response.status_code >= 400:
        return {
            "ok": False,
            "status": response.status_code,
            "error": response.text[:500],
        }

    results = []
    for item in (response.json().get("web") or {}).get("results") or []:
        results.append(
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": re.sub(r"<[^>]+>", "", item.get("description", "")),
            }
        )
    return {"ok": True, "query": q, "results": results[:count]}


@mcp.tool
def fetch_url(url: str, max_chars: int = FETCH_DEFAULT_CHARS) -> dict[str, Any]:
    """
    Fetch a public web page and return its main content as compact markdown/text
    (navigation, ads, and boilerplate stripped). Use on 1-3 sources per topic.
    If a docs site offers a Markdown version of a page, fetching that is cleaner.
    max_chars is clamped to 1000-30000 (default 8000); `truncated` tells you if more exists.
    """
    limit = max(1_000, min(int(max_chars), FETCH_MAX_CHARS))
    try:
        with httpx.Client(
            timeout=30.0,
            follow_redirects=False,
            headers=FETCH_HEADERS,
        ) as client:
            response, body = _get_public(client, url)
    except (ValueError, httpx.HTTPError) as e:
        return {"ok": False, "url": url, "error": str(e)}

    if response.status_code >= 400:
        return {"ok": False, "url": url, "status": response.status_code}

    content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
    charset = response.charset_encoding or "utf-8"
    raw = body.decode(charset, errors="replace")

    title = ""
    if content_type in ("text/html", "application/xhtml+xml") or (
        not content_type and raw.lstrip().startswith("<")
    ):
        # Pass bytes so trafilatura detects the page encoding (meta charset etc.).
        text = trafilatura.extract(
            body,
            url=str(response.url),
            output_format="markdown",
            include_tables=True,
            include_links=False,
            include_images=False,
            favor_precision=True,
        ) or ""
        metadata = trafilatura.extract_metadata(body)
        title = (metadata.title if metadata else "") or ""
    elif content_type.startswith("text/") or content_type in ("application/json", "application/xml"):
        text = raw
    else:
        return {
            "ok": False,
            "url": url,
            "error": f"Unsupported content type: {content_type or 'unknown'}",
        }

    text = _collapse_whitespace(text)
    if not text:
        return {
            "ok": False,
            "url": url,
            "error": "No readable content extracted (page may require JavaScript or login)",
        }

    return {
        "ok": True,
        "url": url,
        "final_url": str(response.url),
        "title": title,
        "content": text[:limit],
        "truncated": len(text) > limit,
        "total_chars": len(text),
    }


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
        "Write a whole lesson body as BlockNote JSON blocks for course_id/topic_id, "
        "replacing everything. Use for new lessons or full rewrites only; to change part "
        "of a lesson use edit_lesson. Rejected if the lesson already has human-managed "
        "blocks (YouTube, Storylane, premium); use edit_lesson for those. "
        "Do NOT start the lesson with a heading that repeats the topic title — the LMS "
        "page already shows the topic title as H1; begin with intro body or a section "
        "heading (e.g. Introduction). Use heading level 3 for section/group headings "
        "and level 4 for subsections; never use level 1, and avoid level 2 (too large "
        "next to the page title). "
        "Free text/media only — no youtubeEmbed, storylaneEmbed, or premium markers. "
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


HUMAN_ONLY_TYPES = {
    "youtubeEmbed",
    "storylaneEmbed",
    "premiumStart",
    "premiumEnd",
    "premiumGate",
}


def _inline_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts = []
    for node in content:
        if not isinstance(node, dict):
            continue
        if node.get("type") == "text":
            parts.append(node.get("text", ""))
        elif node.get("type") == "link":
            parts.append(_inline_text(node.get("content")))
    return "".join(parts)


def _compact_block(block: dict[str, Any]) -> dict[str, Any]:
    btype = block.get("type", "")
    props = block.get("props") or {}
    item: dict[str, Any] = {"id": block.get("id"), "type": btype}
    if btype == "heading":
        item["level"] = props.get("level")
    if btype == "image":
        item["text"] = props.get("caption") or props.get("name") or ""
        item["url"] = props.get("url", "")
    elif btype in HUMAN_ONLY_TYPES:
        item["text"] = props.get("title") or ""
    else:
        item["text"] = _inline_text(block.get("content"))
    if btype in HUMAN_ONLY_TYPES:
        item["protected"] = True
    children = block.get("children") or []
    if children:
        item["children"] = [_compact_block(c) for c in children if isinstance(c, dict)]
    return item


@mcp.tool
def get_lesson(course_id: str, topic_id: str, compact: bool = True) -> dict[str, Any]:
    """
    Load a lesson. compact=True (default) returns each block as
    {id, type, text, protected?, children?} plus updated_at: enough to plan edit_lesson
    operations at a fraction of the tokens. Blocks marked protected (YouTube, Storylane,
    premium markers) are human-managed: never replace or delete them. Use compact=False
    only if you need the raw BlockNote JSON (e.g. inline styles).
    """
    result = _request(
        "GET",
        "/api/course-topics/document",
        params={"courseId": course_id, "topicId": topic_id},
    )
    if not compact or not result.get("ok"):
        return result
    document = result.get("document") or {}
    blocks = document.get("blocks") or []
    return {
        "ok": True,
        "course_id": course_id,
        "topic_id": topic_id,
        "updated_at": document.get("updated_at"),
        "blocks": [_compact_block(b) for b in blocks if isinstance(b, dict)],
    }


@mcp.tool(
    description=(
        "Change specific blocks of an existing lesson without rewriting it. "
        "Human-managed blocks (YouTube, Storylane, premium markers) stay untouched. "
        "Get block ids from get_lesson first and pass its updated_at as expected_updated_at. "
        "operations is an ordered list; each item is one of: "
        '{"op":"replace","blockId":"<id>","blocks":[...]} | '
        '{"op":"insert","afterBlockId":"<id>","blocks":[...]} | '
        '{"op":"insert","beforeBlockId":"<id>","blocks":[...]} | '
        '{"op":"insert","position":"start"|"end","blocks":[...]} | '
        '{"op":"delete","blockId":"<id>"}. '
        f"New blocks follow the same rules as write_lesson. Allowed types: {ALLOWED_BLOCK_TYPES} "
        "All operations apply together or not at all. The response's insertedIds lists the "
        "ids of new blocks, one array per operation. Replacing a block with several blocks "
        "or inserting inside a premium section is fine; the blocks you add there become premium."
    )
)
def edit_lesson(
    course_id: str,
    topic_id: str,
    operations: list[dict[str, Any]],
    expected_updated_at: str | None = None,
) -> dict[str, Any]:
    """Apply block-level edits to a lesson."""
    body: dict[str, Any] = {
        "courseId": course_id,
        "topicId": topic_id,
        "operations": operations,
    }
    if expected_updated_at:
        body["expectedUpdatedAt"] = expected_updated_at
    return _request("POST", "/api/course-topics/document/edit", json_body=body)


@mcp.prompt
def course_authoring_playbook() -> str:
    """How to create a full unpublished course with free lesson content."""
    return f"""
You are authoring LMS courses (any security vendor or product) via MCP tools.
Accuracy matters more than length. Follow this sequence:

1. create_course — always unpublished (server enforces this). Clear title and description.
2. create_topic — add each topic (overview already exists). Stable URL slugs for topic_id.
3. For each topic, one at a time: write the lesson, validate_blocks, fix any issues,
   then write_lesson.
4. Stop. Do NOT publish. A human reviews in /courses/manage and adds YouTube,
   Storylane, and premium sections manually.

Updating an existing lesson: get_lesson (compact) -> edit_lesson with only the blocks
that need to change, passing updated_at as expected_updated_at. Do not use write_lesson
for small changes; it replaces the whole lesson. Never replace or delete blocks marked
protected. If edit_lesson returns 409, call get_lesson again and redo the edit.

Research is opt-in. Only use search_web / fetch_url when the user asks for research
(or gives you URLs to use). When research is requested:
- Work topic by topic; fetch at most 3 sources per topic. Prefer official vendor
  docs / KB > vendor blog > reputable third parties. Skip SEO/aggregator pages.
- Restrict search_web `domains` to the vendor's docs when known.
- Use max_chars 8000 unless a page is truncated and the missing part is clearly needed.
- Condense sources into a short brief (vendor, product, version, key facts, steps,
  gotchas, URLs) and write the lesson only from it. Don't add facts the sources
  don't support, and never paste page text verbatim.
- End the lesson with a level-3 "Sources" heading listing the URLs used as bullets.

BlockNote rules:
- Emit a JSON array of blocks.
- Text blocks use content: [{{"type":"text","text":"...","styles":{{}}}}]
- codeBlock content is a plain string.
- Allowed types: heading, paragraph, bulletListItem, numberedListItem, checkListItem, codeBlock, image, quote, divider.
- Never emit youtubeEmbed, storylaneEmbed, premiumStart, premiumEnd, or premiumGate — humans add those in the editor.
- Do NOT repeat the topic title as the first heading (or anywhere as a lesson H1).
  The LMS UI already shows the topic title above the editor. Start with a short
  intro paragraph, or a section heading like "Introduction" / "Overview" that is
  not a copy of the topic name.
- Heading levels: use level 3 for section/group headings (Introduction, Architecture,
  Sources, etc.) and level 4 for subsections. Never use level 1. Avoid level 2 —
  it looks too large beside the page title.

Example free blocks:
{FREE_BLOCKS_EXAMPLE_JSON}
"""


if __name__ == "__main__":
    mcp.run()
