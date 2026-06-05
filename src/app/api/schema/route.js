/**
 * Self-documenting schema endpoint — returns everything an LLM needs to understand the project.
 * A future LLM session starts with fetch("/api/schema") for instant context.
 * @checkTypes
 */

import { ADMIN_EMAILS } from "@/lib/constants"

export const dynamic = "force-static"

export async function GET() {
  return Response.json({
    name: "StudyHub",
    description: "PWA for high school students — quizzes, resources, chat, admin panel",
    stack: {
      framework: "Next.js 16 (App Router, Turbopack)",
      styling: "Tailwind CSS v4 + CSS custom properties",
      database: "Firebase Firestore (test mode)",
      auth: "Firebase Auth (Email/Password) + Admin SDK (server-side)",
      hosting: "Vercel (studyhub-kenneth-s-projects16.vercel.app)",
    },
    envVars: [
      { var: "FIREBASE_SERVICE_ACCOUNT", purpose: "Admin SDK — full JSON single-line with \\n escapes", required: true },
      { var: "FIREBASE_CLIENT_EMAIL", purpose: "Admin SDK fallback (not recommended)", required: false },
      { var: "FIREBASE_PRIVATE_KEY", purpose: "Admin SDK fallback (not recommended)", required: false },
    ],
    admins: ADMIN_EMAILS,
    collections: {
      "app/data": {
        fields: {
          subjects: "Subject[] — see /api/schema#subject",
          contributors: "string[] — email whitelist",
          info: "InfoSection[] — [{ title: HTML, content: HTML }]",
        },
        access: "Client SDK via /api/data (GET/PUT)",
      },
      "feedback/{id}": {
        fields: { name: "string", message: "string", timestamp: "string(ISO)" },
        access: "Client SDK via /api/feedback (POST/GET)",
      },
      "requests/{id}": {
        fields: { name: "string", subjectId: "string", subjectName: "string", actionType: "add|edit|remove", targetType: "quiz|link|subject", message: "string", timestamp: "string(ISO)", status: "open|resolved" },
        access: "Client SDK via /api/request (POST/GET)",
      },
      "chatRooms/{id}": {
        fields: { name: "string", description: "string", topic: "string", type: "public|private", password: "string?", createdBy: "string(uid)", createdByName: "string", blocked: "string[]?" },
        access: "Direct client SDK",
      },
      "chatRooms/{id}/messages/{auto}": {
        fields: { userId: "string(uid)", userName: "string", userEmail: "string?", text: "string", timestamp: "Timestamp" },
        access: "Direct client SDK",
        note: "Old messages lack userEmail — resolved via uidToEmail map (Admin SDK + users collection)",
      },
      "users/{uid}": {
        fields: { uid: "string", email: "string", createdAt: "string(ISO)", lastSeen: "string(ISO)" },
        access: "POST via /api/users (AuthProvider auto-registers)",
      },
    },
    gradients: {
      admin: "font-bold bg-gradient-to-r from-gray-700 via-gray-300 to-white bg-clip-text text-transparent",
      contributor: "font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent",
      applied: "Chat messages + admin Users tab",
    },
    keyFiles: {
      constants: "src/lib/constants.js",
      authProvider: "src/app/AuthProvider.js",
      chatHooks: "src/lib/chat/hooks.js",
      chatGradients: "src/lib/chat/gradients.js",
      chatPassword: "src/lib/chat/password.js",
      chatModeration: "src/lib/chat/moderation.js",
      profanityFilter: "src/lib/profanity.js",
      adminSDK: "src/lib/firebase-admin.js",
      clientSDK: "src/lib/firebase.js",
    },
    gotchas: [
      "Old chat messages lack userEmail — resolved via uidToEmail[msg.userId]",
      "FIREBASE_SERVICE_ACCOUNT must be single-line JSON (not pretty-printed)",
      "app/data is a single doc — concurrent saves clobber",
      "No Firestore security rules — all client requests are accepted",
      "Chat messages limited to 200 — no pagination",
    ],
  })
}
