import { adminDB } from "@/lib/firebase-admin"

export async function POST(request) {
  try {
    const { name, message, subjectId, subjectName, actionType, targetType } = await request.json()
    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ success: false, error: "Message is required" }, { status: 400 })
    }
    await adminDB.collection("requests").add({
      name: typeof name === "string" && name.trim() ? name.trim() : "Anonymous",
      message: message.trim(),
      subjectId: subjectId || "",
      subjectName: subjectName || "",
      actionType: ["add", "edit", "remove"].includes(actionType) ? actionType : "edit",
      targetType: ["quiz", "link", "subject", "info"].includes(targetType) ? targetType : "quiz",
      status: "open",
      timestamp: new Date().toISOString(),
    })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}

export async function GET() {
  try {
    const snap = await adminDB.collection("requests").orderBy("timestamp", "desc").get()
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return Response.json(requests)
  } catch (e) {
    return Response.json([], { status: 200 })
  }
}
