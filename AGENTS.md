<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# StudyHub Project Context

## Identity
StudyHub is a PWA for 9th-grade students to access study materials — quizzes, resource links, subject guides. Built by Kenneth C., hosted on Vercel, using Firebase.

## Tech Stack
- **Framework:** Next.js 16 (App Router) with Turbopack
- **Styling:** Tailwind CSS v4 + CSS custom properties (--c-bg, --c-fg, --c-muted, --c-subtle, --c-card, --c-border)
- **Database:** Firebase Firestore (collection: `app` doc: `data`, collection: `feedback`)
- **Auth:** Firebase Auth (Email/Password)
- **Hosting:** Vercel — auto-deploys from GitHub main branch
- **PWA:** manifest.json + sw.js + SVG icons

## Directory Layout
```
src/
  lib/firebase.js        ← db (Firestore) + auth (Firebase Auth)
  app/
    layout.js            ← Root layout, AuthProvider wrapper, theme init script
    globals.css          ← CSS variables, dark mode (.dark), density classes, responsive breakpoints
    page.js              ← Landing page (hero + Login/Signup, redirects if logged in)
    AuthProvider.js      ← Firebase Auth context (user, loading, signUp, logIn, logOut)
    SettingsPanel.js     ← Gear icon: dark mode, font size, density
    login/page.js        ← Email/password login → redirects to /dashboard
    signup/page.js       ← Email/password signup → redirects to /dashboard
    dashboard/page.js    ← Main app after login: classroom sidebar + subject grid
    subjects/[id]/page.js ← Subject detail (quizzes + links)
    quiz/[id]/page.js    ← Quiz taker (instant feedback, scoring, progress dots)
    admin/
      page.js            ← Auth gate → redirects to /dashboard or /login
      dashboard/page.js  ← CRUD editor for subjects, quizzes, links + feedback viewer
    api/
      data/route.js      ← GET/PUT app/data on Firestore (validates subjects is array)
      feedback/route.js  ← POST/GET feedback collection (validates message required)
```

## Navigation Flow
```
/ (landing page) ──logged in──→ /dashboard
                ──not logged in──→ login → /dashboard
/dashboard → subject card → /subjects/[id] → quiz link → /quiz/[id]
/dashboard → "Admin" link → /admin/dashboard
/admin (auth gate) → /dashboard (logged in) or /login (not logged in)
```

## Key Conventions
- **Client components** use `"use client"` directive
- **CSS theming:** Always use `var(--c-*)` — never hardcode colors. Dark mode = `.dark` on `<html>`.
- **Mobile:** Single-column grids below 640px. Admin sidebar stacks. Use `subject-grid` and `admin-layout` CSS classes.
- **State:** Settings saved to `localStorage("studyhub-settings")`. Classrooms saved to `localStorage("studyhub-classrooms")`.
- **Firebase:** Single-doc pattern for app data. GET returns doc, PUT overwrites whole doc (validates body first).
- **Feedback:** `name` (optional) + `message` (required) + `timestamp` per document in `feedback` collection.

## Firebase Schema
```
app/data → { subjects: [{ id, name, icon, description, color, classroom, quizzes: [{ id, title, questions: [{ question, options: [4], answer }] }], links: [{ title, url, description }] }] }
feedback/{id} → { name, message, timestamp }
```

## Live URLs
- **Production:** https://studyhub-kenneth-s-projects16.vercel.app
- **GitHub:** https://github.com/caraanjohnkenneth43-crypto/studyhub
- **Firebase Console:** https://console.firebase.google.com/project/studyhub-e1f30

## Common Commands
- `npm run dev` — start dev server on localhost:3000
- `npm run build` — production build
- `npm run lint` — run ESLint
- `git add -A && git commit -m "..." && git push` — deploy

## Known Decisions & Gotchas
- Hardcoded admin password replaced with Firebase Auth (any logged-in user = admin for now — no role system yet)
- After login/signup, redirects to `/dashboard` (not `/admin/dashboard`)
- "Back" links on subject/quiz pages go to `/dashboard`, not `/`
- Quiz results "Back to dashboard" goes to `/dashboard`
- Classrooms stored in localStorage, not yet persisted to backend
- Feedback stored in Firestore (separate collection), not filesystem
- Dark mode via CSS custom properties + class toggle, not Tailwind dark:
- `app/data` is a single Firestore document (1MB max, 20k fields max — fine for school project)
- No offline caching implemented (sw.js only registers install/activate)
- No Firestore security rules (test mode — acceptable for school project)
