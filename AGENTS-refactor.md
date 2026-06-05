# StudyHub — Refactoring & Architecture

Current state: https://github.com/caraanjohnkenneth43-crypto/studyhub

## Splitting Pattern
```
AGENTS.md              ← 20 lines: identity, stack, rules
AGENTS-chat.md         ← Chat system only
AGENTS-admin.md        ← Admin panel only  
AGENTS-firebase.md     ← Firebase + API routes
AGENTS-database.md     ← Data models
AGENTS-refactor.md     ← This file
```

## Chat Module Pattern
```
src/lib/constants.js   ← All hardcoded values (admins, gradients, LS keys, colors)
src/lib/chat/
  hooks.js             ← React hooks (useRoom, useMessages, useUserMap)
  gradients.js         ← Pure gradient functions (getGradientClass, getNameColor)
  password.js          ← Password gate helpers
  moderation.js        ← Block/unblock helpers
src/app/chat/[id]/page.js ← Thin: imports from src/lib/chat/*
```

## Upgrade Order
1. Centralize constants → src/lib/constants.js (DONE)
2. Create chat utilities → src/lib/chat/*
3. Thin page.js (uses utilities from lib)
4. Add JSDoc types
5. Add /api/schema
6. Add firestore.rules
7. Update opencode.json sub-agents
8. Verify: npm run build
