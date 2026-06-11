# Overnight Autonomous Sprint

7 milestones. Run by `hermes cron`. Each milestone is self-contained, builds, and commits.
Auto-skips any milestone requiring Firebase Console, OAuth consent screen, or manual API key creation.

## How to run

```bash
hermes cron create "every 4h" --name "studyhub-sprint" \
  --script studyhub-sprint.sh \
  --workdir /home/caraa/studyhub \
  --deliver local
```

The script reads `~/.hermes/scripts/studyhub-sprint.state` to determine the next milestone.
Each milestone delegates to OpenCode via `hermes -z "--skills opencode,studyhub-enterprise-loop --accept-hooks"`.

## Milestones

### M1: Direct Messages
- New Firestore collection `conversations/{pairId}/messages/{msgId}`
- Pair ID: lexical sort of both UIDs joined by `__` (e.g. `uid1__uid2`)
- DM UI: conversation list sidebar + message view
- `/api/conversations` endpoints (list, create, send)
- Firestore rules for conversations collection
- Skip if `conversations/` collection exists in firestore.rules

### M2: Enterprise UI Redesign
- Left sidebar with subject icons + chat + calculator nav
- Top navbar with user menu, theme switcher, settings
- Main content area fills remaining space
- Typography: larger base font, better spacing, card-based layouts
- Consistent header/footer across all pages
- Responsive: sidebar collapses on mobile

### M3: Classroom Persistence
- Move classrooms from localStorage to Firestore `classrooms/{id}`
- `/api/classrooms` CRUD endpoints
- Dashboard reads from Firestore instead of localStorage
- Migration: seed classrooms from existing classroom data
- Firestore rules for classrooms collection

### M4: User Profiles
- Profile page at `/profile/[uid]` or `/profile`
- Shows: displayName, email, join date, quiz stats (total taken, avg score)
- Editable displayName (currently in SettingsPanel — move or link)
- `/api/users/me` endpoint for own profile
- Extend users collection schema with stats fields

### M5: Custom Quiz Sets
- New collection `userQuizzes/{id}`
- Creation UI: form with title, subject, questions (question+options+correct+explanation)
- Browse page: list public quizzes, filter by subject
- Play through: reuse existing quiz player component
- Public/private toggle on creation
- Firestore rules for userQuizzes collection

### M6: Personal Notes
- New collection `notes/{id}`
- Per-user notes tied to subjects
- Markdown editor with preview
- Note list per subject on subject page
- Create/edit/delete via `/api/notes`
- Firestore rules for notes collection

### M7: Graph-View Notes
- Visual note linking graph (force-directed layout)
- Nodes = notes, edges = links between notes
- Links created via `[[wikilink]]` syntax in note content
- Render graph using a lightweight canvas-based approach (no heavy libs)
- Graph view accessible from subject page or dedicated route

## Skip logic

Each milestone checks if it's already been implemented:
- Search for key files/collections (e.g. `src/app/conversations/` for DMs)
- If files exist, mark milestone done and move to next
- If implementation would require Firebase Console → skip with log message

## Build & Commit

After each milestone:
1. `npm run build` — must pass
2. `git add -A && git commit -m "sprint: M<N> - <title>"`
3. Update `~/.hermes/scripts/studyhub-sprint.state` with completed milestone number

## Resume

If a milestone fails (build breaks, LLM error, timeout):
- Script logs the failure to `~/.hermes/scripts/studyhub-sprint.log`
- Same milestone is retried on next cron tick
- If failed 3 times, skip and log as `M<N>: SKIPPED (3 failures)`
