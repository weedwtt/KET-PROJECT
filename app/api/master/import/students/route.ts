import { db } from "@/lib/db"

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
  พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
  กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
}

const TITLE_PREFIXES = ["นางสาว", "นาง", "นาย", "เด็กชาย", "เด็กหญิง", "ดร.", "ผศ.", "รศ.", "ศ."]

function parseThaiDate(s: string): Date | null {
  if (!s || s === "NaN") return null
  const parts = s.trim().split(/\s+/)
  if (parts.length !== 3) return null
  const day = parseInt(parts[0])
  const month = THAI_MONTHS[parts[1]]
  const buddhistYear = parseInt(parts[2])
  if (!day || !month || !buddhistYear) return null
  return new Date(buddhistYear - 543, month - 1, day)
}

function parseThaiName(full: string): { firstName: string; lastName: string } {
  const s = (full ?? "").replace(/\s+/g, " ").trim()
  for (const t of TITLE_PREFIXES) {
    if (s.startsWith(t)) {
      const rest = s.slice(t.length).trim()
      const parts = rest.split(" ")
      return { firstName: parts[0] || s, lastName: parts.slice(1).join(" ") }
    }
  }
  const parts = s.split(" ")
  return { firstName: parts[0] || s, lastName: parts.slice(1).join(" ") }
}

function parseClassRoom(s: string): { gradeLevel: string; classRoom: number } {
  const m = (s ?? "").match(/^(ม\.\d+)\/(\d+)$/)
  if (m) return { gradeLevel: m[1], classRoom: parseInt(m[2]) }
  const m2 = (s ?? "").match(/^(ป\.\d+)\/(\d+)$/)
  if (m2) return { gradeLevel: m2[1], classRoom: parseInt(m2[2]) }
  return { gradeLevel: s || "-", classRoom: 1 }
}

function normalizeBloodType(s: string): string | null {
  if (!s || s === "NaN") return null
  const map: Record<string, string> = {
    "เอ (A)": "A", "บี (B)": "B", "โอ (O)": "O", "เอบี (AB)": "AB",
    "A": "A", "B": "B", "O": "O", "AB": "AB",
  }
  return map[s.trim()] ?? (s.trim().slice(0, 5) || null)
}

function str(row: string[], col: number): string {
  const v = row[col]
  return v === null || v === undefined || v === "NaN" || v !== v ? "" : String(v).trim()
}

export async function POST(req: Request) {
  const body = await req.json() as { rows: string[][] }
  const rows = body.rows

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const total = rows.length
        send({ type: "start", total })

        const [allTitles, allRelations, allTeachers, allTeacherTitles] = await Promise.all([
          db.title.findMany(),
          db.guardianRelation.findMany(),
          db.teacher.findMany(),
          db.teacherTitle.findMany(),
        ])

        const titleCache = new Map(allTitles.map(t => [t.name, t.id]))
        const relCache = new Map(allRelations.map(r => [r.name, r.id]))
        // Map: "firstName lastName" → teacherId
        const teacherMap = new Map(allTeachers.map(t => [`${t.firstName} ${t.lastName}`, t.id]))
        const teacherTitleCache = new Map(allTeacherTitles.map(t => [t.name, t.id]))

        async function getOrCreateTitle(name: string): Promise<number> {
          const key = name || "นาย"
          if (titleCache.has(key)) return titleCache.get(key)!
          const t = await db.title.create({ data: { name: key } })
          titleCache.set(key, t.id)
          return t.id
        }

        async function getOrCreateTeacherTitle(name: string): Promise<number> {
          const key = name || "นาย"
          if (teacherTitleCache.has(key)) return teacherTitleCache.get(key)!
          const t = await db.teacherTitle.create({ data: { name: key } })
          teacherTitleCache.set(key, t.id)
          return t.id
        }

        async function getOrCreateRelation(name: string): Promise<number> {
          if (relCache.has(name)) return relCache.get(name)!
          const r = await db.guardianRelation.create({ data: { name } })
          relCache.set(name, r.id)
          return r.id
        }

        async function getOrCreateTeacherId(fullName: string): Promise<number | null> {
          if (!fullName) return null
          const normalized = fullName.replace(/\s+/g, " ").trim()
          const { firstName, lastName } = parseThaiName(normalized)
          if (!firstName) return null

          const key = `${firstName} ${lastName}`
          if (teacherMap.has(key)) return teacherMap.get(key)!

          // ไม่เจอในDB — สร้างใหม่จากชื่อที่มี (ข้อมูลอื่นใช้ placeholder)
          const titleName = normalized.replace(`${firstName} ${lastName}`, "").trim() || "นาย"
          const titleId = await getOrCreateTeacherTitle(titleName || "นาย")
          const teacher = await db.teacher.create({
            data: {
              titleId,
              firstName,
              lastName,
              phone: "-",
              addressHouseNo: "-",
              addressSubDistrict: "-",
              addressDistrict: "-",
              addressProvince: "-",
              addressPostalCode: "00000",
            },
          })
          teacherMap.set(key, teacher.id)
          return teacher.id
        }

        let done = 0
        let skipped = 0
        const errors: { row: number; message: string }[] = []

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const rowNum = i + 1

          try {
            const studentCode = str(row, 3)
            if (!studentCode) {
              skipped++
              send({ type: "skip", row: rowNum, message: "ไม่มีรหัสนักเรียน" })
              continue
            }

            const { gradeLevel, classRoom } = parseClassRoom(str(row, 1))
            const titleId = await getOrCreateTitle(str(row, 4))
            const birthDate = parseThaiDate(str(row, 7))
            const rawNid = str(row, 8).replace(/[^0-9]/g, "")
            const isRealNid = rawNid.length === 13 && !/^0+$/.test(rawNid)
            const nationalId = isRealNid ? rawNid : `X${studentCode}`

            const studentData = {
              classNumber: parseInt(str(row, 2)) || 0,
              gradeLevel,
              classRoom,
              titleId,
              firstName: str(row, 5) || "-",
              lastName: str(row, 6) || "-",
              birthDate: birthDate ?? new Date("2000-01-01"),
              nationalId: nationalId.padEnd(13, "0").slice(0, 13),
              phone: str(row, 10) || null,
              nationality: str(row, 19) || "ไทย",
              ethnicity: str(row, 20) || "ไทย",
              religion: str(row, 21) || "พุทธ",
              bloodType: normalizeBloodType(str(row, 22)),
              addressHouseNo: str(row, 23) || "-",
              addressMoo: str(row, 24) || null,
              addressVillage: str(row, 25) || null,
              addressRoad: str(row, 26) || null,
              addressSoi: str(row, 27) || null,
              addressSubDistrict: str(row, 28) || "-",
              addressDistrict: str(row, 29) || "-",
              addressProvince: str(row, 30) || "-",
              addressPostalCode: str(row, 31).slice(0, 5).padEnd(5, "0") || "00000",
            }

            const student = await db.student.upsert({
              where: { studentCode },
              update: studentData,
              create: { studentCode, ...studentData },
            })

            // Re-create guardians (delete then insert)
            await db.guardian.deleteMany({ where: { studentId: student.id } })

            const fatherName = str(row, 11)
            if (fatherName) {
              const { firstName, lastName } = parseThaiName(fatherName)
              const relId = await getOrCreateRelation("บิดา")
              await db.guardian.create({
                data: { studentId: student.id, firstName, lastName, phone: "-", relationId: relId },
              })
            }

            const motherName = str(row, 12)
            if (motherName) {
              const { firstName, lastName } = parseThaiName(motherName)
              const relId = await getOrCreateRelation("มารดา")
              await db.guardian.create({
                data: { studentId: student.id, firstName, lastName, phone: "-", relationId: relId },
              })
            }

            const guardianDefs = [
              { nameCol: 14, phoneCol: 13 },
              { nameCol: 16, phoneCol: 15 },
              { nameCol: 18, phoneCol: 17 },
            ]
            for (const { nameCol, phoneCol } of guardianDefs) {
              const gName = str(row, nameCol)
              if (!gName) continue
              const { firstName, lastName } = parseThaiName(gName)
              const relId = await getOrCreateRelation("ผู้ปกครอง")
              await db.guardian.create({
                data: {
                  studentId: student.id,
                  firstName,
                  lastName,
                  phone: str(row, phoneCol) || "-",
                  relationId: relId,
                },
              })
            }

            // Student advisors
            await db.studentAdvisor.deleteMany({ where: { studentId: student.id } })
            for (let slot = 1; slot <= 2; slot++) {
              const teacherName = str(row, 31 + slot) // col 32 = advisor1, col 33 = advisor2
              const teacherId = await getOrCreateTeacherId(teacherName)
              if (teacherId) {
                await db.studentAdvisor.create({
                  data: { studentId: student.id, teacherId, slot },
                })
              }
            }

            done++
            send({
              type: "progress",
              row: rowNum,
              done,
              skipped,
              total,
              studentCode,
              name: `${str(row, 4)}${str(row, 5)} ${str(row, 6)}`,
            })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            errors.push({ row: rowNum, message })
            send({ type: "error", row: rowNum, message })
          }
        }

        send({ type: "done", done, skipped, errors: errors.length, total })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        send({ type: "fatal", message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
