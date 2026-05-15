import { db } from "@/lib/db"

export async function GET() {
  const count = await db.statementRecord.count({ where: { status: "pending" } })
  return Response.json({ count })
}
