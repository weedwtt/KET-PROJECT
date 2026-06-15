import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { htmlToPdf } from "@/lib/pdf/browser"
import { renderBondHtml, type BondHtmlData } from "@/lib/pdf/bond-html"

// Puppeteer needs the Node.js runtime (not edge) and enough time to spin up Chromium.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

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
      select: { firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true },
    }),
    db.teacher.findFirst({
      where: { role: "VICE_DIRECTOR" },
      select: { firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true },
    }),
  ])

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  const st = record.student
  const contractParts = thaiDateParts(record.contractDate)

  const vLines = (record.violationDetail ?? "").split("\n")
  const violationLine1 = vLines[0] ?? ""
  const violationLine2 = vLines[1] ?? ""

  // ลายเซ็น รองผอ./ผอ. แสดงเฉพาะที่บันทึกไว้จริงตอนอนุมัติ (record.*Signature) เท่านั้น
  // ก่อนอนุมัติ column เหล่านี้เป็น null — ไม่ดึงลายเซ็นโปรไฟล์ตาม role มาแสดง
  // ค่า "signed" คือ marker ว่าอนุมัติแล้วแต่ผู้อนุมัติไม่มีรูปลายเซ็น → ไม่ต้องใส่รูป
  const sigImage = (v: string | null) => (v && v !== "signed" ? v : null)

  const data: BondHtmlData = {
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
    // ใช้เฉพาะลายเซ็นที่ลงนามจริงตอนอนุมัติ (live) — ไม่ดึงลายเซ็นโปรไฟล์มาแสดง
    // ก่อนกดอนุมัติ ไม่งั้นจะขึ้นลายเซ็นทับเส้นทั้งที่ยังรออนุมัติอยู่
    headTeacherSignatureUrl: record.headTeacherSignature ?? null,
    disciplineTeacherSignatureUrl: record.disciplineTeacherSignature ?? null,
    viceDirectorSignatureUrl: sigImage(record.viceDirectorSignature),
    viceDirectorName: viceDirector ? fullName(viceDirector.title, viceDirector.firstName, viceDirector.lastName) : "",
    directorSignatureUrl: sigImage(record.directorSignature),
    directorName: director ? fullName(director.title, director.firstName, director.lastName) : "",
    viceDirectorComment: record.viceDirectorComment ?? null,
    directorComment: record.directorComment ?? null,
  }

  const pdf = await htmlToPdf(renderBondHtml(data), { cropSignatures: true })

  const filename = `bond-${id}.pdf`
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
