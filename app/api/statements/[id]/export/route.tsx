import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { renderToBuffer } from "@react-pdf/renderer"
import { StatementPdf, type StatementPdfData } from "@/lib/pdf/statement-pdf"

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
      disciplineTeacher: {
        select: { firstName: true, lastName: true, signatureUrl: true, title: { select: { name: true } } },
      },
      gradeHeadTeacher: {
        select: { firstName: true, lastName: true, signatureUrl: true, title: { select: { name: true } } },
      },
    },
  })

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  const pdfData: StatementPdfData = {
    id: record.id,
    recordDate: record.recordDate.toISOString(),
    recordedBy: record.recordedBy ?? "",
    subject: record.subject,
    content: record.content,
    incidentAt: record.incidentAt?.toISOString() ?? null,
    location: record.location,
    considerationMeasures: record.considerationMeasures,
    resultMeasures: record.resultMeasures,
    measureNotes: record.measureNotes,
    studentSignature: record.studentSignature,
    guardianSignature: record.guardianSignature,
    advisorSignature: record.advisorSignature,
    semester: record.semester,
    academicYear: record.academicYear,
    violationCategory: record.violationCategory,
    student: record.student,
    bond: record.bond,
    disciplineTeacher: record.disciplineTeacher,
    gradeHeadTeacher: record.gradeHeadTeacher,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(<StatementPdf record={pdfData} /> as any)

  const filename = `statement-${id}.pdf`
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
