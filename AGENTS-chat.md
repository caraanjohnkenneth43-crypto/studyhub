# StudyHub — Chat System

## Files
- `src/app/chat/page.js` — lobby (room list, create, auto-create General, block filter)
- `src/app/chat/[id]/page.js` — room (messages, send, password, block panel)
- `src/app/ChatNotificationProvider.js` — real-time notif subscriptions, sound, popup
- `src/lib/chat/hooks.js` — useRoom, useMessages, useUserMap, useActiveRoom
- `src/lib/chat/gradients.js` — getGradientClass(), getNameColor()

## Data Model
chatRooms/{id}:
  { name, description, topic, type:"public"|"private", password?, createdBy, createdByName, blocked?:[email] }
chatRooms/{id}/messages/{auto}:
  { userId, userName, userEmail?, text, timestamp }

## Gradient Rules
- Admin (ADMIN_EMAILS): bold black→white gradient
- Contributor (data.contributors): bold blue→purple gradient
- Own messages (non-admin/contributor): blue
- Others: default text color
- Old messages resolve email via uidToEmail[msg.userId]

## Features
- Password gate: localStorage("chat-passwords"), persisted permanently
- Owner kick/block: updateDoc blocked[] array, filtered from lobby
- Profanity filter: censorMessage on send + deleteDoc on load
- Sticky header, auto-scroll button
- 200 message limit (no pagination)
- Deleted old profanity messages via onSnapshot
