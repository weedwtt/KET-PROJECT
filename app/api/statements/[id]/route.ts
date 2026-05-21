import { NextRequest } from "next/server"
import { db } from "@/lib/db"

const STATEMENT_INCLUDE = {
  student: {
    select: {
      id: true,
      studentCode: true,
      firstName: true,
      lastName: true,
      gradeLevel: true,
      classRoom: true,
      classNumber: true,
      nationalId: true,
      birthDate: true,
      phone: true,
      nationality: true,
      ethnicity: true,
      religion: true,
      bloodType: true,
      addressHouseNo: true,
      addressMoo: true,
      addressVillage: true,
      addressRoad: true,
      addressSoi: true,
      addressSubDistrict: true,
      addressDistrict: true,
      addressProvince: true,
      addressPostalCode: true,
      title: { select: { name: true } },
      guardians: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
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
  semester: { select: { id: true, name: true, value: true } },
  academicYear: { select: { id: true, year: true } },
  violationCategory: { select: { id: true, name: true } },
  violationSubCategory: { select: { id: true, name: true } },
  bond: true,
  disciplineTeacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      signatureUrl: true,
      title: { select: { name: true } },
    },
  },
  gradeHeadTeacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      signatureUrl: true,
      title: { select: { name: true } },
    },
  },
  approvedByTeacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      signatureUrl: true,
      title: { select: { name: true } },
    },
  },
} as const

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = await db.statementRecord.findUnique({
    where: { id: Number(id) },
    include: STATEMENT_INCLUDE,
  })
  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  return Response.json(record)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await db.statementRecord.findUnique({ where: { id: Number(id) } })
  if (!existing) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  await db.statementRecord.delete({ where: { id: Number(id) } })
  return new Response(null, { status: 204 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const existing = await db.statementRecord.findUnique({
    where: { id: Number(id) },
    include: { bond: { select: { id: true } } },
  })
  if (!existing) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  if (existing.status === "approved") {
    return Response.json({ error: "ไม่สามารถแก้ไขรายการที่อนุมัติแล้ว" }, { status: 400 })
  }

  const {
    semesterId,
    academicYearId,
    violationCategoryId,
    violationSubCategoryId,
    subject,
    detail,
    incidentDateTime,
    location,
    advisor1Name,
    advisor2Name,
    recorder,
    considerationMeasures,
    resultMeasures,
    measureNotes,
    bond,
    studentSignature,
    guardianSignature,
    advisorSignature,
    disciplineTeacherId,
    gradeHeadTeacherId,
    gradeHeadSignature,
  } = body

  // Bond: upsert if provided, delete if removed
  let bondUpdate: Record<string, unknown> = {}
  if (bond && bond.guardianId) {
    bondUpdate = {
      bond: {
        upsert: {
          create: {
            guardianId: Number(bond.guardianId),
            penaltyActions: Array.isArray(bond.penaltyActions) ? bond.penaltyActions : [],
            deductPoints: bond.deductPoints ? Number(bond.deductPoints) : null,
            witnessName: bond.witnessName || null,
          },
          update: {
            guardianId: Number(bond.guardianId),
            penaltyActions: Array.isArray(bond.penaltyActions) ? bond.penaltyActions : [],
            deductPoints: bond.deductPoints ? Number(bond.deductPoints) : null,
            witnessName: bond.witnessName || null,
          },
        },
      },
    }
  } else if (existing.bond) {
    bondUpdate = { bond: { delete: true } }
  }

  const record = await db.statementRecord.update({
    where: { id: Number(id) },
    data: {
      semesterId: semesterId ? Number(semesterId) : undefined,
      academicYearId: academicYearId ? Number(academicYearId) : undefined,
      violationCategoryId: violationCategoryId ? Number(violationCategoryId) : undefined,
      violationSubCategoryId: violationSubCategoryId !== undefined
        ? (violationSubCategoryId ? Number(violationSubCategoryId) : null)
        : undefined,
      subject: subject ?? undefined,
      content: detail ?? undefined,
      incidentAt: incidentDateTime ? new Date(incidentDateTime) : undefined,
      location: location ?? undefined,
      advisor1Name: advisor1Name !== undefined ? (advisor1Name || null) : undefined,
      advisor2Name: advisor2Name !== undefined ? (advisor2Name || null) : undefined,
      recordedBy: recorder !== undefined ? (recorder || null) : undefined,
      considerationMeasures: Array.isArray(considerationMeasures) ? considerationMeasures : undefined,
      resultMeasures: Array.isArray(resultMeasures) ? resultMeasures : undefined,
      measureNotes: measureNotes !== undefined ? (measureNotes || null) : undefined,
      studentSignature: studentSignature !== undefined ? (studentSignature || null) : undefined,
      guardianSignature: guardianSignature !== undefined ? (guardianSignature || null) : undefined,
      advisorSignature: advisorSignature !== undefined ? (advisorSignature || null) : undefined,
      disciplineTeacherId: disciplineTeacherId !== undefined ? (disciplineTeacherId ? Number(disciplineTeacherId) : null) : undefined,
      gradeHeadTeacherId: gradeHeadTeacherId !== undefined ? (gradeHeadTeacherId ? Number(gradeHeadTeacherId) : null) : undefined,
      gradeHeadSignature: gradeHeadSignature !== undefined ? (gradeHeadSignature || null) : undefined,
      ...bondUpdate,
    },
  })

  return Response.json({ id: record.id })
}
