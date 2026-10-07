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
pip install -r requirements.txt fastmcp
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
5. Keep **Horizon Authentication enabled** (default).
6. Invite org members who should use the tools; tighten tool permissions under Access if needed.
7. Open the server → **Connect** and paste the snippet for Cursor / Claude Desktop / ChatGPT / Claude Code.

### Client notes

- Interactive clients: use Horizon Connect + sign-in (no LMS token in the client).
- Automation: `Authorization: Bearer fmcp_...` (Horizon API key), still never put `LMS_MCP_TOKEN` in client config.

## Authoring flow for agents

1. `create_course` (unpublished)
2. `create_topic` for each lesson (overview already exists)
3. `validate_blocks` → `write_lesson` per topic
4. Stop — human reviews in `/courses/manage` and wraps premium sections in the editor

## Free BlockNote allowlist

`heading`, `paragraph`, `bulletListItem`, `numberedListItem`, `checkListItem`, `codeBlock`, `image`, `youtubeEmbed`, `storylaneEmbed`, `quote`, `divider`

Rejected for MCP writes: `premiumStart`, `premiumEnd`, `premiumGate`.
