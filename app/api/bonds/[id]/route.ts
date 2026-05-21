import { NextRequest } from "next/server"
import { db } from "@/lib/db"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await db.bondRecord.findUnique({ where: { id: Number(id) } })
  if (!existing) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  await db.bondRecord.delete({ where: { id: Number(id) } })
  return new Response(null, { status: 204 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = await db.bondRecord.findUnique({
    where: { id: Number(id) },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
          gradeLevel: true,
          classRoom: true,
          classNumber: true,
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
                  id: true, firstName: true, lastName: true,
                  title: { select: { name: true } },
                },
              },
            },
          },
        },
      },
      guardian: { select: { id: true, firstName: true, lastName: true, phone: true, relation: { select: { name: true } } } },
      headTeacher: { select: { id: true, firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true } },
      disciplineTeacher: { select: { id: true, firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true } },
      approvedByTeacher: { select: { id: true, firstName: true, lastName: true, title: { select: { name: true } } } },
    },
  })

  if (!record) return Response.json({ error: "ไม่พบข้อมูล" }, { status: 404 })
  return Response.json(record)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const existing = await db.bondRecord.findUnique({ where: { id: Number(id) } })
  if (!existing) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  const {
    contractDate, semesterId, academicYearId,
    guardianId, guardianName, guardianRelation, guardianPhone,
    addressHouseNo, addressMoo, addressVillage, addressRoad, addressSoi,
    addressSubDistrict, addressDistrict, addressProvince,
    violationDetail, measureDeductScore, measureDeductPoints,
    measureActivity, measureSuspension, measureTransfer,
    advisor1Name, advisor2Name,
    recorder, status, headTeacherId, headTeacherSignature, disciplineTeacherId,
    guardianSignature, studentSignature, advisorSignature,
  } = body

  const record = await db.bondRecord.update({
    where: { id: Number(id) },
    data: {
      contractDate: contractDate ? new Date(contractDate) : undefined,
      semesterId: semesterId !== undefined ? (semesterId ? Number(semesterId) : null) : undefined,
      academicYearId: academicYearId !== undefined ? (academicYearId ? Number(academicYearId) : null) : undefined,
      guardianId: guardianId !== undefined ? (guardianId ? Number(guardianId) : null) : undefined,
      guardianName, guardianRelation,
      guardianPhone: guardianPhone || null,
      addressHouseNo: addressHouseNo || null,
      addressMoo: addressMoo || null,
      addressVillage: addressVillage || null,
      addressRoad: addressRoad || null,
      addressSoi: addressSoi || null,
      addressSubDistrict: addressSubDistrict || null,
      addressDistrict: addressDistrict || null,
      addressProvince: addressProvince || null,
      violationDetail,
      measureDeductScore: !!measureDeductScore,
      measureDeductPoints: measureDeductScore && measureDeductPoints ? Number(measureDeductPoints) : null,
      measureActivity: !!measureActivity,
      measureSuspension: !!measureSuspension,
      measureTransfer: !!measureTransfer,
      advisor1Name: advisor1Name !== undefined ? (advisor1Name || null) : undefined,
      advisor2Name: advisor2Name !== undefined ? (advisor2Name || null) : undefined,
      recorder,
      status: status ?? undefined,
      headTeacherId: headTeacherId !== undefined ? (headTeacherId ? Number(headTeacherId) : null) : undefined,
      headTeacherSignature: headTeacherSignature !== undefined ? (headTeacherSignature || null) : undefined,
      disciplineTeacherId: disciplineTeacherId !== undefined ? (disciplineTeacherId ? Number(disciplineTeacherId) : null) : undefined,
      guardianSignature: guardianSignature !== undefined ? (guardianSignature || null) : undefined,
      studentSignature: studentSignature !== undefined ? (studentSignature || null) : undefined,
      advisorSignature: advisorSignature !== undefined ? (advisorSignature || null) : undefined,
    },
  })
  return Response.json({ id: record.id })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const record = await db.bondRecord.update({
      where: { id: Number(id) },
      data: body,
    })
    return Response.json(record)
  } catch {
    return Response.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
  }
}
