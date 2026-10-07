# LMS Courses MCP (Prefect Horizon)

FastMCP server that wraps this app’s course APIs so Cursor, Claude, ChatGPT, and other MCP clients can create unpublished courses, topics, and free BlockNote lessons.

## Architecture

```
MCP client  →  Prefect Horizon (/mcp)  →  this FastMCP server  →  LMS HTTP APIs
                     (OAuth / fmcp_)              LMS_MCP_TOKEN
```

- **Horizon** authenticates who may call tools.
- **LMS** authenticates the server with `Authorization: Bearer <LMS_MCP_TOKEN>`.
- MCP-created courses are always **`published: false`**.
- Lesson tools accept **free BlockNote blocks only** (no premium markers).

## Tools

| Tool | Purpose |
|------|---------|
| `search_web` | Web search (Brave Search API) → title, url, snippet; optional `domains` filter |
| `fetch_url` | Fetch a public page → main content as compact markdown (size-capped) |
| `list_courses` | List courses (incl. unpublished) |
| `get_course` | Course + topics |
| `create_course` | Create unpublished course + overview |
| `list_topics` | List topics |
| `create_topic` | Add topic + starter document |
| `update_topic` | Patch title / paid_only / sort_order |
| `validate_blocks` | Dry-run free BlockNote validation |
| `write_lesson` | Save BlockNote `blocks` |
| `get_lesson` | Load saved document |

Prompt: `course_authoring_playbook` — recommended authoring sequence.

## LMS app env (Next.js)

Set on the LMS host (Vercel / `.env.local`):

```bash
LMS_MCP_TOKEN=generate-a-long-random-secret
LMS_MCP_ACTOR_USER_ID=optional-admin-user-uuid
```

`LMS_MCP_ACTOR_USER_ID` is stored as `updated_by` on documents when the MCP token is used.

## Local smoke test

1. Run the Next app with `LMS_MCP_TOKEN` set.
2. From this directory:

```bash
pip install -r requirements.txt
set LMS_BASE_URL=http://localhost:3000
set LMS_MCP_TOKEN=same-as-next
python main.py
```

Point a local MCP client at stdio, or use Horizon for remote Streamable HTTP.

## Deploy on Prefect Horizon

1. Sign in at [horizon.prefect.io](https://horizon.prefect.io) and create/join an organization.
2. Connect the Horizon GitHub App to **this LMS repository**.
3. Create a hosted server:
   - **Name:** e.g. `lms-courses` → `https://lms-courses.fastmcp.app/mcp`
   - **Entrypoint:** `mcp/lms-courses/main.py:mcp` (named FastMCP object)
   - **Dependency file:** `mcp/lms-courses/requirements.txt`
4. Server environment / secrets:
   - `LMS_BASE_URL` — **public** LMS origin (Horizon cannot reach `localhost`)
   - `LMS_MCP_TOKEN` — same value as the Next.js env
   - `BRAVE_SEARCH_API_KEY` — key from [Brave Search API](https://brave.com/search/api/) for `search_web`
5. Keep **Horizon Authentication enabled** (default).
6. Invite org members who should use the tools; tighten tool permissions under Access if needed.
7. Open the server → **Connect** and paste the snippet for Cursor / Claude Desktop / ChatGPT / Claude Code.

### Client notes

- Interactive clients: use Horizon Connect + sign-in (no LMS token in the client).
- Automation: `Authorization: Bearer fmcp_...` (Horizon API key), still never put `LMS_MCP_TOKEN` in client config.

## Authoring flow for agents

1. `create_course` (unpublished) → `create_topic` for each lesson (overview already exists)
2. Per topic: write the lesson → `validate_blocks` → `write_lesson`
3. Stop — human reviews in `/courses/manage` and adds YouTube, Storylane, and premium sections

Research is opt-in: agents use `search_web` / `fetch_url` only when your prompt asks for research or supplies URLs. Then they fetch at most 3 sources per topic, write from a short brief, and end the lesson with a Sources list.

## Research safeguards

- `fetch_url` only allows public `http(s)` hosts; private/internal IPs are blocked on every redirect hop.
- Responses are capped at 3 MB downloaded and 30,000 characters returned (default 8,000).
- HTML is reduced to main content with trafilatura; PDFs and other binary types are rejected.
- Pages that need JavaScript or login return an error instead of junk.

## Free BlockNote allowlist

`heading`, `paragraph`, `bulletListItem`, `numberedListItem`, `checkListItem`, `codeBlock`, `image`, `quote`, `divider`

Rejected for MCP writes (add manually in the editor): `youtubeEmbed`, `storylaneEmbed`, `premiumStart`, `premiumEnd`, `premiumGate`.
