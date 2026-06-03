import fs from "fs"
import path from "path"

const dataPath = path.join(process.cwd(), "data", "content.json")

function readData() {
  const raw = fs.readFileSync(dataPath, "utf-8")
  return JSON.parse(raw)
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8")
}

export async function GET() {
  const data = readData()
  return Response.json(data)
}

export async function PUT(request) {
  try {
    const body = await request.json()
    writeData(body)
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  }
}