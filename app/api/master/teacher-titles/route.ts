import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const titles = await db.teacherTitle.findMany({ orderBy: { id: "asc" } })
  return NextResponse.json(titles)
}
