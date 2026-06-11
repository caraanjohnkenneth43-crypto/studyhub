# Hermes — StudyHub Tweaks & Fixes

Paste this into Hermes. It has read the vault and this session's context.

---

## Priority Order (do in this sequence)

### 1. Fix `/api/chat/rooms` — rooms command in dev console
`/api/chat/rooms` GET must return ALL rooms with:
- Room ID, room name, type (public/private), password (if private), list of users that have access (if private)
- The dev console `rooms` command should display all these fields
- Parse `blocked` field to exclude blocked users from "users that have access"

### 2. Fix notes/graph — notes not saving, graph broken
- Notes created via `/notes` page do NOT persist to Firestore
- Graph view always shows 0 notes even when notes exist
- Debug: test `/api/notes` POST endpoint, check Firestore rules for notes collection, check the notes page save flow end-to-end
- Fix the saveNote function, the graph data fetch, and the note creation flow
- After fix: creating a note with [[wikilinks]] should show up as a node in /notes/graph

### 3. Remove calculator
- Delete `/calculator` route entirely
- Remove calculator link from Navbar, AppShell, and any other navigation

### 4. Fix chat message sending bug
- "Chat rooms eventually make it so that users cannot send messages anymore"
- Investigate: message limit (currently 200), Firestore rules, auth token expiry, useSendMessage hook
- Fix root cause — may be related to message count limit, Firestore write quota, or state management

### 5. Image + emoji sending in chat
- Add a `+` button in the chat textbar that opens:
  - Emoji picker (use a lightweight approach — simple emoji grid)
  - Image upload (store as base64 in Firestore message doc — no Firebase Storage needed since it's not enabled)
- Save sent images as "stickers" in a separate panel accessible from the chat UI
- Sticker panel: grid of previously sent images, click to re-send
- Data: add `type: "text" | "image" | "sticker"` field to chat message schema, add `imageUrl` and `stickerId` fields

### 6. Room members panel (Discord-style)
- Add a "members" toggle/panel in chat rooms
- Shows ALL users that have access to the room (not blocked)
- Status indicators:
  - Green dot: active in last 5 minutes (has sent a message or has presence heartbeat)
  - Yellow dot: has the page open but no activity in 5+ minutes
  - Grey dot: no presence data (offline/inactive)
- Show "last active" timestamp for each user
- Reuse the existing `presence/` collection for status tracking

### 7. Room-aware top navbar
- The global Navbar should show room-specific controls when inside a chat room:
  - Back button (← Back to lobby)
  - Room name
  - Members toggle button
  - Settings button
- Remove the duplicate header that currently appears inside chat room pages
- The Navbar already exists at `src/app/Navbar.js` — extend it with room-aware context

### 8. Reorganize settings
- Split SettingsPanel into two sections:
  - **Account settings**: displayName, email, password change, avatar
  - **Display settings**: font size (12-24px), dark mode, PFP size in lobbies (small/medium/large)
- Move theme picker from SettingsPanel to the Navbar (direct dropdown, not hidden in settings)
- Avatar/PFP upload: use base64 stored in Firestore `users/{uid}.avatar` field (no Firebase Storage needed)

### 9. Enterprise UI redesign — final polish (MOST DELICATE)
- This is the last task. Review and polish meticulously.
- Apply a modern, sleek design across ALL pages:
  - Consistent spacing, typography, color usage
  - Card-based layouts with subtle shadows and rounded corners
  - Smooth transitions and hover effects
  - Not too small — readable font sizes, generous padding
  - Easy navigation — everything reachable within 2 clicks
  - Mobile responsive
- The Navbar at the top is the primary navigation. Page-specific headers should be minimal or removed.
- Review every page: dashboard, classroom, chat, DMs, notes, profile, admin dashboard, dev console
- Ensure CSS variables (`--c-*`) are used consistently — no hardcoded colors
- Test after every change, build before committing

## Rules
- All API routes use Admin SDK, never client SDK server-side
- No Firebase Console / Storage activation needed — base64 for images/avatars
- Build must pass after every milestone
- Commit and push after each milestone with message: `fix: <milestone>`
- Use the enterprise code loop: plan first, then delegate to OpenCode, then review with 550B
- Update vault docs (Decisions.md, Architecture.md, _todo.md) after each milestone
