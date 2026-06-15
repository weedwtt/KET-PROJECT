import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import fs from "fs"
import path from "path"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import { THAI_MONTHS, thaiIncidentDateParts, thaiIncidentTime } from "@/lib/datetime"

function thaiDate(d: Date | string | null): string {
  if (!d) return ""
  const dt = typeof d === "string" ? new Date(d) : d
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`
}

// วันที่เหตุเกิด (wall-clock UTC) → "d เดือน พ.ศ."
function incidentDateStr(d: Date | string | null): string {
  const { day, month, year } = thaiIncidentDateParts(d)
  return day ? `${day} ${month} ${year}` : ""
}

function chk(arr: string[], key: string): string {
  return arr.includes(key) ? "✓" : "   "
}

function fullName(t: { name: string } | null | undefined, first: string, last: string): string {
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
      bond: { select: { deductPoints: true } },
    },
  })

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  const s = record.student

  // Guardians: find father, mother, and primary guardian
  const father = s.guardians.find((g) =>
    g.relation?.name.includes("บิดา") || g.relation?.name.includes("พ่อ")
  )
  const mother = s.guardians.find((g) =>
    g.relation?.name.includes("มารดา") || g.relation?.name.includes("แม่")
  )
  const guardian = s.guardians[0]

  // Advisors by slot
  const advisor1 = s.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = s.advisors.find((a) => a.slot === 2)?.teacher

  const considerMeasures = record.considerationMeasures ?? []
  const resultMeasures = record.resultMeasures ?? []

  const data = {
    studentFullName: fullName(s.title, s.firstName, s.lastName),
    studentCode:     s.studentCode ?? "",
    gradeLevel:      s.gradeLevel ? `${s.gradeLevel}/${s.classRoom}` : "",
    classNumber:     String(s.classNumber ?? ""),
    fatherName:      father ? `${father.firstName} ${father.lastName}` : "",
    motherName:      mother ? `${mother.firstName} ${mother.lastName}` : "",
    guardianName:    guardian ? `${guardian.firstName} ${guardian.lastName}` : "",
    houseNo:         s.addressHouseNo ?? "",
    moo:             s.addressMoo ?? "",
    village:         s.addressVillage ?? "",
    road:            s.addressRoad ?? "",
    soi:             s.addressSoi ?? "",
    subDistrict:     s.addressSubDistrict ?? "",
    district:        s.addressDistrict ?? "",
    province:        s.addressProvince ?? "",
    advisor1:        advisor1 ? fullName(advisor1.title, advisor1.firstName, advisor1.lastName) : "",
    advisor2:        advisor2 ? fullName(advisor2.title, advisor2.firstName, advisor2.lastName) : "",
    semesterValue:   String(record.semester.value),
    academicYear:    String(record.academicYear.year),
    violationCategory: record.violationCategory.name,
    subject:         record.subject ?? "",
    content:         (record.content ?? "").replace(/\n/g, " "),
    incidentDate:    incidentDateStr(record.incidentAt),
    incidentTime:    thaiIncidentTime(record.incidentAt),
    location:        record.location ?? "",
    recordedBy:      record.recordedBy ?? "",
    recordDate:      thaiDate(record.recordDate),
    ch_notify_parent:    chk(considerMeasures, "notify_parent"),
    ch_invite_parent:    chk(considerMeasures, "invite_parent"),
    ch_verbal_warning:   chk(resultMeasures, "verbal_warning"),
    ch_deduct_score:     chk(resultMeasures, "deduct_score"),
    ch_behavior_activity: chk(resultMeasures, "behavior_activity"),
    ch_probation_bond:   chk(resultMeasures, "probation_bond"),
    deductPoints:        record.bond?.deductPoints ? String(record.bond.deductPoints) : "",
  }

  const templatePath = path.join(process.cwd(), "public", "templates", "statement-template.docx")
  const templateBuf = fs.readFileSync(templatePath)

  const zip = new PizZip(templateBuf)
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
  doc.render(data)

  const output = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer

  const filename = `statement-${id}.docx`
  return new Response(new Uint8Array(output), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
