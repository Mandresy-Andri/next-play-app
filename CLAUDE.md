# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Next Play — Kanban Task Board** (internship assessment).
A polished, full-stack Kanban board inspired by Asana / Linear / Notion. The full brief lives at `docs/NP SDE Assessment Challenge.md` — it is the source of truth for requirements.

The repo currently contains only the brief; the application has not been scaffolded yet.

## Required Stack

- **React + Vite + TailwindCSS** (mandatory)
- **TypeScript** (recommended)
- **Supabase** (free tier) — Postgres, Auth, RLS
- **react-beautiful-dnd** for drag-and-drop
- Hosting: Vercel / Netlify / Cloudflare Pages (free tier)
- No custom backend — the frontend talks to Supabase directly

## Design Constraints (heavily evaluated)

- **Neumorphism** style (see neumorphism.io)
- Palette: mostly **white with soft shadows**, **light blue** for accents/highlights
- Cohesive typography, clear visual hierarchy
- Smooth DnD interactions, thoughtful empty / loading / error states
- Responsive layout

Avoid generic "todo list" aesthetics — the bar is "something a team would want to use daily."

## Core Functional Requirements

- Kanban board with columns: **To Do, In Progress, In Review, Done**
- Drag tasks between columns to update `status`
- **Optimistic updates** with graceful Supabase error handling
- **Spaces**: users can create multiple spaces (Work, Personal, …), each with its own board
- **Guest auth** via Supabase anonymous sign-in:
  - Auto-create guest session on first launch
  - Guests are real users with `anonymous = true`
  - On later email/password sign-in, upgrade the same row (`anonymous → false`); do not create a new user
- **RLS enabled** so users only see their own data

## Data Model (minimum)

`tasks`: `id uuid pk`, `title text not null`, `status text` (todo|in_progress|in_review|done), `user_id uuid`, `created_at timestamp`.
Bonus columns: `description`, `priority` (low|normal|high), `due_date`, `assignee_id`.
Additional tables expected for spaces, team members, comments, activity log, and labels (see Advanced Features in the brief).

## Advanced Features (optional, differentiating)

Spaces · Team members & assignees · Task comments · Activity log · Labels/tags · Due-date indicators · Search & filters · Board stats page. Implement as time allows; prioritize design polish + core board first.

## Documentation Expectations (high priority)

When the app exists, the README must cover:
- How to run locally
- Design + engineering decisions
- All RLS policies and Postgres functions
- React component overview
- Supabase schema diagram
- Data flow / system / state diagrams
- A folder containing all SQL schemas and migrations

## Supabase Project

- **URL**: `https://zgrxevscvjyblzfddsbb.supabase.co`
- **Project ref**: `zgrxevscvjyblzfddsbb`
- An **MCP server** named `supabase-nextplay` is configured in `.mcp.json` pointing at Supabase's **hosted remote MCP server** (`https://mcp.supabase.com/mcp`) in read-write mode with features `database,docs,debugging,development,functions`. Use it to inspect and modify the live project directly rather than guessing at SQL.
- Authentication is **OAuth 2.1 with PKCE** via browser — no PAT, no env var, no secrets in the repo. Tokens are cached in Claude Code's per-user credential store and shared across the VS Code extension and the PowerShell CLI. If MCP calls fail with auth errors, the user needs to re-authenticate from their Claude Code client (the browser flow will re-trigger automatically).
- Supabase docs warn the hosted MCP is for development/testing only, not production data. This project is a fresh empty dev project — fine. If we ever touch a production project, switch to a scoped PAT and `read_only=true`.

## Secrets Policy (strict)

- **Never commit** any of: `SUPABASE_ACCESS_TOKEN`, service role key, anon key in a committed file (`.env.example` is the one exception — it contains placeholders only), database passwords, or JWT secrets.
- The frontend uses only the **anon key**, exposed via `VITE_SUPABASE_ANON_KEY` in a gitignored `.env.local`.
- The **service role key must never** appear in client code, `.mcp.json`, or any committed file — it bypasses RLS.
- `.gitignore` already blocks `.env`, `.env.*` (except `.env.example`), `*.local`, `secrets/`, and related patterns. If you add a new kind of secret file, update `.gitignore` *before* writing the secret.
- Before running `git add` on anything ambiguous, verify the file does not contain credentials.

## Working Notes

- The brief is **confidential** — do not paste its contents into external services or public links.
- When scaffolding, use `npm create vite@latest` with the React + TS template, then add Tailwind per its Vite guide.
