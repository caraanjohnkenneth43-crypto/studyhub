<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# StudyHub

PWA for ~20 high school freshmen. Built by Kenneth C. Hosted on Vercel.

## Stack
- Next.js 16 (App Router, Turbopack) + Tailwind CSS v4
- Firebase Firestore + Firebase Auth
- Firebase Admin SDK (server-side, via FIREBASE_SERVICE_ACCOUNT)

## Quick Files
- `src/lib/firebase.js` ← client SDK (db + auth)
- `src/lib/firebase-admin.js` ← server SDK (adminAuth + initError)
- `src/lib/constants.js` ← all hardcoded values (admins, gradients, keys)
- `src/app/AuthProvider.js` ← auth context (user, loading, isAdmin, allowedAdmins)

## Rules
- Client components: `"use client"` directive
- CSS: `var(--c-*)` — never hardcode colors
- Dark mode: `.dark` class on `<html>`
- Settings: localStorage("studyhub-settings")
- Chat passwords: localStorage("chat-passwords")

## Navigation
`/` → login/signup → `/dashboard` → subjects → quizzes
`/admin/dashboard` — tabs: Subjects, Contributors, Users, Feedback, Requests, Info
`/chat` — room list, create form
`/chat/[id]` — real-time messages, password gate, block panel

## Deploy
```
npm run dev          # local
npm run build        # verify
git add -A && git commit -m "..." && git push  # deploy
```

## Gotchas
- Old chat messages lack `userEmail` — resolved via uidToEmail map (Admin SDK + users collection)
- `FIREBASE_SERVICE_ACCOUNT` must be single-line JSON with `\n` escapes
- `app/data` is single-doc — concurrent saves clobber
- No Firestore security rules yet
