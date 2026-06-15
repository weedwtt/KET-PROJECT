import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { htmlToPdf } from "@/lib/pdf/browser"
import { renderStatementHtml, type StatementHtmlData } from "@/lib/pdf/statement-html"
import { thaiIncidentDateParts, thaiIncidentTime } from "@/lib/datetime"

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

function thaiDateStr(d: Date | string | null) {
  if (!d) return ""
  const { day, month, year } = thaiDateParts(d)
  return `${day} ${month} ${year}`
}

function fullName(t: { name: string } | null | undefined, first: string, last: string) {
  return `${t?.name ?? ""}${first} ${last}`.trim()
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const record = await db.statementRecord.findUnique({
    where: { id: Number(id) },
    include: {
      student: {
        select: {
          studentCode: true,
          firstName: true,
          lastName: true,
          gradeLevel: true,
          classRoom: true,
          classNumber: true,
          addressHouseNo: true,
          addressMoo: true,
          addressVillage: true,
          addressRoad: true,
          addressSoi: true,
          addressSubDistrict: true,
          addressDistrict: true,
          addressProvince: true,
          title: { select: { name: true } },
          guardians: {
            select: {
              firstName: true,
              lastName: true,
              relation: { select: { name: true } },
            },
          },
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
      semester: { select: { name: true, value: true } },
      academicYear: { select: { year: true } },
      violationCategory: { select: { name: true } },
      violationSubCategory: { select: { name: true } },
      bond: { select: { deductPoints: true } },
      disciplineTeacher: {
        select: { firstName: true, lastName: true, signatureUrl: true, title: { select: { name: true } } },
      },
      gradeHeadTeacher: {
        select: { firstName: true, lastName: true, signatureUrl: true, title: { select: { name: true } } },
      },
      approvedByTeacher: {
        select: { firstName: true, lastName: true, signatureUrl: true, title: { select: { name: true } } },
      },
      signatureTeacher: {
        select: { firstName: true, lastName: true, signatureUrl: true, title: { select: { name: true } } },
      },
    },
  })

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  // Standing signatures of the school director / deputy director, pulled by role
  // (the approval boxes are fixed officials, like the grade-head signing column).
  const [director, viceDirector] = await Promise.all([
    db.teacher.findFirst({ where: { role: "DIRECTOR" }, select: { signatureUrl: true } }),
    db.teacher.findFirst({ where: { role: "VICE_DIRECTOR" }, select: { signatureUrl: true } }),
  ])

  // ลายเซ็น รองผอ./ผอ. จะแสดงเฉพาะเมื่อผ่านการอนุมัติในขั้นนั้นแล้วเท่านั้น
  // สถานะ: pending = รอรองผอ., pending_director = รองผอ.อนุมัติแล้ว(รอผอ.), approved = อนุมัติครบ
  // ก่อนอนุมัติไม่ดึงลายเซ็นโปรไฟล์มาแสดง ไม่งั้นลายเซ็นจะขึ้นทั้งที่ยังรออนุมัติอยู่
  const viceApproved = record.status === "pending_director" || record.status === "approved"
  const directorApproved = record.status === "approved"

  const st = record.student
  const father = st.guardians.find((g) =>
    g.relation?.name.includes("บิดา") || g.relation?.name.includes("พ่อ")
  )
  const mother = st.guardians.find((g) =>
    g.relation?.name.includes("มารดา") || g.relation?.name.includes("แม่")
  )
  const guardian = st.guardians[0]
  const advisor1 = st.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = st.advisors.find((a) => a.slot === 2)?.teacher
  const incident = thaiIncidentDateParts(record.incidentAt)

  const data: StatementHtmlData = {
    studentName: fullName(st.title, st.firstName, st.lastName),
    studentCode: st.studentCode ?? "",
    gradeLevel: st.gradeLevel ?? "",
    classRoom: st.classRoom,
    classNumber: st.classNumber,
    fatherName: father ? `${father.firstName} ${father.lastName}` : "",
    motherName: mother ? `${mother.firstName} ${mother.lastName}` : "",
    guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}` : "",
    houseNo: st.addressHouseNo ?? "",
    moo: st.addressMoo ?? "",
    village: st.addressVillage ?? "",
    road: st.addressRoad ?? "",
    soi: st.addressSoi ?? "",
    subDistrict: st.addressSubDistrict ?? "",
    district: st.addressDistrict ?? "",
    province: st.addressProvince ?? "",
    advisor1: advisor1 ? fullName(advisor1.title, advisor1.firstName, advisor1.lastName) : "",
    advisor2: advisor2 ? fullName(advisor2.title, advisor2.firstName, advisor2.lastName) : "",
    semesterValue: String(record.semester.value),
    academicYear: String(record.academicYear.year),
    violationCategory: record.violationCategory.name,
    subCategory: record.violationSubCategory?.name ?? "",
    subject: record.subject ?? "",
    content: record.content ?? "",
    incidentDay: incident.day,
    incidentMonth: incident.month,
    incidentYear: incident.year,
    incidentTime: thaiIncidentTime(record.incidentAt),
    location: record.location ?? "",
    recordedBy: record.recordedBy ?? "",
    recordDate: thaiDateStr(record.recordDate),
    considerMeasures: record.considerationMeasures ?? [],
    resultMeasures: record.resultMeasures ?? [],
    deductPoints: record.bond?.deductPoints ? String(record.bond.deductPoints) : "",
    studentSignatureUrl: record.studentSignature ?? null,
    guardianSignatureUrl: record.guardianSignature ?? null,
    advisorSignatureUrl: record.advisorSignature ?? null,
    // ใช้เฉพาะลายเซ็นที่ลงนามจริงตอนอนุมัติ (live) — ไม่ดึงลายเซ็นโปรไฟล์มาแสดง
    // ก่อนกดอนุมัติ ไม่งั้นจะขึ้นลายเซ็นทับเส้นทั้งที่ยังรออนุมัติอยู่
    gradeHeadSignatureUrl: record.gradeHeadSignature ?? null,
    disciplineTeacherSignatureUrl: record.disciplineTeacherSignature ?? null,
    directorSignatureUrl: directorApproved ? director?.signatureUrl ?? null : null,
    viceDirectorSignatureUrl: viceApproved ? viceDirector?.signatureUrl ?? null : null,
    viceDirectorComment: record.viceDirectorComment ?? null,
    directorComment: record.directorComment ?? null,
  }

  const pdf = await htmlToPdf(renderStatementHtml(data), { cropSignatures: true })

  const filename = `statement-${id}.pdf`
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
