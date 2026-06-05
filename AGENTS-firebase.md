# StudyHub — Firebase

## Project
- ID: studyhub-e1f30
- Console: https://console.firebase.google.com/project/studyhub-e1f30

## Client SDK (src/lib/firebase.js)
- Exports: db (Firestore), auth (Auth)
- Config hardcoded (public API key — safe for client)

## Admin SDK (src/lib/firebase-admin.js)
- Only runs in API routes (server-side, not browser)
- Env var: FIREBASE_SERVICE_ACCOUNT (full JSON, single line with \n escapes)
- Fallback: FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (not recommended)
- Exports: adminAuth, initError
- Used by: /api/users GET (listUsers)

## Collections
| Path | Schema |
|------|--------|
| app/data | { subjects[], contributors[], info[] } |
| feedback/{auto} | { name, message, timestamp } |
| requests/{auto} | { name, subjectId, subjectName, actionType, targetType, message, timestamp, status } |
| chatRooms/{id} | { name, description, topic, type, password?, createdBy, createdByName, blocked?[] } |
| chatRooms/{id}/messages/{auto} | { userId, userName, userEmail?, text, timestamp } |
| users/{uid} | { uid, email, createdAt, lastSeen } |

## API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| /api/data | GET/PUT | app/data CRUD |
| /api/feedback | GET/POST | feedback submissions |
| /api/request | GET/POST | student requests |
| /api/users | GET/POST | list Auth users / register user |
| /api/schema | GET | self-documenting schema (for LLMs) |

## Auth Method
Email/Password only. Config in Firebase Console.
