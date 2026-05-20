import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { BondPDF, type BondPDFData } from "./bond-pdf"

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
]

function thaiDateParts(d: Date | string | null) {
  if (!d) return { day: "", month: "", year: "" }
  const dt = typeof d === "string" ? new Date(d) : d
  return {
    day: String(dt.getDate()),
    month: THAI_MONTHS[dt.getMonth()],
    year: String(dt.getFullYear() + 543),
  }
}

function fullName(t: { name: string } | null | undefined, first: string, last: string) {
  return `${t?.name ?? ""}${first} ${last}`.trim()
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [record, director, viceDirector] = await Promise.all([
    db.bondRecord.findUnique({
      where: { id: Number(id) },
      include: {
        student: {
          select: {
            studentCode: true,
            firstName: true,
            lastName: true,
            gradeLevel: true,
            classRoom: true,
            title: { select: { name: true } },
            advisors: {
              select: {
                slot: true,
                teacher: {
                  select: {
                    firstName: true,
                    lastName: true,
                    title: { select: { name: true } },
                  },
                },
              },
              orderBy: { slot: "asc" as const },
            },
          },
        },
        headTeacher: {
          select: { firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true },
        },
        disciplineTeacher: {
          select: { firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true },
        },
      },
    }),
    db.teacher.findFirst({
      where: { role: "DIRECTOR" },
      select: { firstName: true, lastName: true, title: { select: { name: true } } },
    }),
    db.teacher.findFirst({
      where: { role: "VICE_DIRECTOR" },
      select: { firstName: true, lastName: true, title: { select: { name: true } } },
    }),
  ])

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  const st = record.student
  const contractParts = thaiDateParts(record.contractDate)

  // Split violation detail into max 2 display lines (split on newline, or keep as-is)
  const vLines = (record.violationDetail ?? "").split("\n")
  const violationLine1 = vLines[0] ?? ""
  const violationLine2 = vLines[1] ?? ""

  const data: BondPDFData = {
    id: record.id,
    contractDay: contractParts.day,
    contractMonth: contractParts.month,
    contractYear: contractParts.year,
    guardianName: record.guardianName,
    guardianRelation: record.guardianRelation,
    guardianPhone: record.guardianPhone ?? "",
    studentName: fullName(st.title, st.firstName, st.lastName),
    studentCode: st.studentCode ?? "",
    gradeLevel: st.gradeLevel ?? "",
    classRoom: st.classRoom,
    houseNo: record.addressHouseNo ?? "",
    moo: record.addressMoo ?? "",
    village: record.addressVillage ?? "",
    road: record.addressRoad ?? "",
    soi: record.addressSoi ?? "",
    subDistrict: record.addressSubDistrict ?? "",
    district: record.addressDistrict ?? "",
    province: record.addressProvince ?? "",
    violationLine1,
    violationLine2,
    measureDeductScore: record.measureDeductScore,
    measureDeductPoints: record.measureDeductPoints,
    measureActivity: record.measureActivity,
    measureSuspension: record.measureSuspension,
    measureTransfer: record.measureTransfer,
    guardianSignatureUrl: record.guardianSignature ?? null,
    studentSignatureUrl: record.studentSignature ?? null,
    advisorSignatureUrl: record.advisorSignature ?? null,
    headTeacherSignatureUrl: record.headTeacher?.signatureUrl ?? null,
    disciplineTeacherSignatureUrl: record.disciplineTeacher?.signatureUrl ?? null,
    viceDirectorSignatureUrl: record.viceDirectorSignature ?? null,
    viceDirectorName: viceDirector ? fullName(viceDirector.title, viceDirector.firstName, viceDirector.lastName) : "",
    directorSignatureUrl: record.directorSignature ?? null,
    directorName: director ? fullName(director.title, director.firstName, director.lastName) : "",
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(BondPDF, { data }) as any)

  const filename = `bond-${id}.pdf`
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
