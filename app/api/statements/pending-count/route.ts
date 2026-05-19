import { db } from "@/lib/db"

export async function GET() {
  const [statements, bonds] = await Promise.all([
    db.statementRecord.count({ where: { status: "pending" } }),
    db.bondRecord.count({ where: { directorSignature: null } }),
  ])
  return Response.json({ count: statements + bonds })
}
