# StudyHub Sprint — M1: Direct Messages

## Stage 1: PLAN (Nemotron 550B) — ✅ COMPLETE

### Architecture Overview
- **New Firestore collection**: `conversations/{pairId}/messages/{msgId}`
- **Pair ID**: lexical sort of both UIDs joined by `__` (e.g., `uid1__uid2`)
- **Sidebar UI**: DM conversation list in chat page sidebar (alongside rooms)
- **API endpoints**: `/api/conversations` (GET list, POST create/ensure, POST send message)
- **Security rules**: New rules for `conversations` and `conversations/{pairId}/messages`

---

### File Changes Required

#### 1. **Firestore Rules** (`firestore.rules`)
- Add `match /conversations/{pairId}` with read/write for participants
- Add `match /conversations/{pairId}/messages/{messageId}` with standard message rules
- Deny all else

#### 2. **Constants** (`src/lib/constants.js`)
- Add `CONVERSATIONS: "conversations"` to FIRESTORE object

#### 3. **API Routes** (new: `src/app/api/conversations/route.js`)
- **GET**: List current user's conversations (with last message preview)
- **POST**: Create/ensure conversation between two users (lexical pairId)
- **PUT/PATCH**: Send message to conversation (or separate endpoint)

#### 4. **Chat Hooks** (`src/lib/chat/hooks.js`) — *add new hooks*
- `useConversations(user)` — real-time subscription to user's conversations
- `useConversationMessages(pairId)` — real-time messages for a DM
- `useSendDM(pairId, user, text, setText)` — send DM
- `useCreateOrGetConversation(otherUid, user)` — create/get lexical pairId

#### 5. **Chat Page** (`src/app/chat/page.js`) — *modify*
- Add DM sidebar section below Rooms
- Show conversation list with other user's name/avatar
- Click to navigate to `/chat/dm/[pairId]`

#### 6. **New DM Page** (`src/app/chat/dm/[pairId]/page.js`) — *new file*
- Similar to `chat/[id]/page.js` but for DMs
- Header shows other user's name
- Real-time messages
- Send message form
- No password/blocking features (DMs are always private)

#### 7. **Dashboard** (`src/app/dashboard/page.js`) — *optional enhancement*
- Add DM preview in sidebar (recent conversations)

---

### Key Implementation Details

#### Lexical Pair ID Generation
```javascript
function getPairId(uid1, uid2) {
  return [uid1, uid2].sort().join("__");
}
```

#### Conversation Document Structure
```javascript
{
  participants: [uid1, uid2],
  participantEmails: ["email1", "email2"], // for easy display
  lastMessage: { text: "...", timestamp: ..., senderId: "..." },
  updatedAt: serverTimestamp(),
  createdAt: serverTimestamp()
}
```

#### Message Document Structure (subcollection)
```javascript
{
  userId: "senderUid",
  userName: "Sender Name",
  userEmail: "sender@email.com",
  text: "message text",
  timestamp: serverTimestamp()
}
```

#### API: GET /api/conversations
- Query conversations where current user's UID is in `participants` array
- Order by `updatedAt` desc
- Return with lastMessage preview

#### API: POST /api/conversations
- Body: `{ otherUid }`
- Generate pairId, check if exists, create if not
- Return conversation doc

#### API: POST /api/conversations/[pairId]/messages (or PUT)
- Body: `{ text }`
- Add to messages subcollection
- Update parent conversation `lastMessage` and `updatedAt`

---

### Edge Cases & Risks

1. **Concurrent conversation creation**: Two users create DM simultaneously → lexical pairId ensures same ID, use `setDoc` with merge or transaction
2. **Self-DMs**: Prevent creating conversation with self
3. **Deleted users**: Handle gracefully if other user deleted
4. **Real-time updates**: Conversation list must update when new message arrives
5. **Performance**: Limit conversation list to ~50, messages to 100
6. **Security**: Users can only read/write conversations they're part of
7. **Migration**: Existing chat rooms unaffected

---

### Stage 2: CODE (OpenCode / DeepSeek V4 Flash) — PENDING

Will delegate to opencode with this plan.

---

### Stage 3: REVIEW (Nemotron 550B) — PENDING

Review checklist:
- [ ] Firestore rules correctly restrict access to participants only
- [ ] No XSS in message rendering (text content escaped)
- [ ] Lexical pairId logic correct for all UID combinations
- [ ] API routes use Admin SDK (not client SDK)
- [ ] Real-time listeners properly cleaned up
- [ ] No console.log in production code
- [ ] CSS uses var(--c-*) tokens, no hardcoded colors
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)

---

### Build & Commit (after review passes)
```bash
npm run build
git add -A && git commit -m "sprint: M1 - Direct Messages"
```