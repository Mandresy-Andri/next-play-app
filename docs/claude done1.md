All three waves complete. Build passes, security advisors clean, every core +
advanced feature shipped.

Summary\
Backend (Supabase — live at zgrxevscvjyblzfddsbb)

- 7 migrations applied: profiles, spaces/space_members, tasks,
  labels/comments/activity_log, RLS, functions/triggers, FK indexes - 8 tables,
  RLS on all. Fixed a recursion trap by introducing a
  public.is_space_member(uuid) security-definer helper - Triggers: auto-profile
  on signup, default "Personal" space on profile create, auto-owner on space
  create, activity log on task mutation, updated_at bumps
- RPC reorder_task(task_id, status, position) for atomic drag-and-drop -
  Realtime on tasks, comments, activity_log - Security advisors: clean.
  Performance: only "unused index" info warnings (expected on empty tables) -
  Types regenerated to src/lib/database.types.ts - Reference: docs/schema.md (ER
  diagram, per-table RLS, function catalog) Frontend (Vite + React 19 + TS +
  Tailwind v4 + neumorphism) - Design system: neumorphic tokens in
  src/index.css, Plus Jakarta Sans, primitives in src/components/ui/
- Auth: anonymous bootstrap, guest→permanent upgrade via updateUser (preserves
  profile row)
- Spaces sidebar with live data, create modal, color/icon picker, mobile drawer
- Board: 4 columns, react-beautiful-dnd, optimistic reorder via RPC, realtime
  subscription, filter bar (search + priority + assignee + label + due-window,
  URL-persisted)
- Task detail right slide-over: inline editing, LabelPicker with inline create,
  CommentThread (realtime), ActivityFeed
- Labels CRUD modal per space
- StatsPage: headline cards, status/priority bars, recent activity
- Toast system, error boundary, skeletons, empty states
- Page transitions via framer-motion AnimatePresence
- npm run build and npm run lint: zero errors

Docs

- docs/schema.md — complete backend reference
- README.md — run-local, design/engineering decisions, component table,
  data/system flow diagrams, folder tree, features checklist

User action needed before running:

1. Fill VITE_SUPABASE_ANON_KEY in .env.local (copy from .env.example)
2. Enable Anonymous sign-in in the Supabase dashboard: Auth → Providers →
   Anonymous
3. npm install && npm run dev
