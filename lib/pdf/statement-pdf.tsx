import React from "react"
import { Document, Page, View, Text, Image, Font, StyleSheet } from "@react-pdf/renderer"
import path from "path"

Font.register({
  family: "Sarabun",
  fonts: [
    { src: path.join(process.cwd(), "public", "fonts", "Sarabun-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public", "fonts", "Sarabun-Bold.ttf"), fontWeight: 700 },
  ],
})
Font.registerHyphenationCallback((w) => [w])

const LOGO_PATH = path.join(process.cwd(), "public", "images", "school-logo.png")
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"]

// DOCX: sz values are half-points. sz=32→16pt, sz=28→14pt, sz=36→18pt
const FS_TITLE  = 18   // sz=36  title
const FS_HEAD   = 16   // sz=32  header info rows, consideration, opinion
const FS_BODY   = 14   // sz=28  table body content
const FS_DOCNO  = 16   // sz=32  บก.1

function thaiDate(d: string | null) {
  if (!d) return { day: "—", month: "—", year: "—", time: "—" }
  const dt = new Date(d)
  return {
    day: String(dt.getDate()),
    month: THAI_MONTHS[dt.getMonth()],
    year: String(dt.getFullYear() + 543),
    time: `${String(dt.getHours()).padStart(2, "0")}.${String(dt.getMinutes()).padStart(2, "0")}`,
  }
}

function thaiDateShort(d: string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`
}

// A4 = 595×842pt, DOCX margins: top=630DXA=31.5pt, left/right=1440DXA=72pt, bottom≈0
const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: FS_HEAD,
    paddingTop: 32,
    paddingHorizontal: 72,
    paddingBottom: 28,
    lineHeight: 1.3,
  },
  // Header
  center: { alignItems: "center" },
  logo: { width: 60, height: 50 },
  title: { fontSize: FS_TITLE, fontWeight: 700, marginTop: 2 },
  docNo: { position: "absolute", top: 32, right: 72, fontSize: FS_DOCNO },

  // Info rows (header section, 16pt)
  infoRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 2 },
  infoLabel: { fontSize: FS_HEAD },
  infoField: { borderBottom: "0.5pt solid black", paddingHorizontal: 2, paddingBottom: 1, minHeight: 16 },
  infoFieldText: { fontSize: FS_HEAD },

  // Main table
  tableWrap: { border: "0.8pt solid black", marginTop: 6 },
  tableHead: { flexDirection: "row", borderBottom: "0.8pt solid black" },
  // Left 72.2%, Right 27.8% (matching DOCX 6758/9355 and 2597/9355)
  tableHeadLeft: { flex: 722, borderRight: "0.8pt solid black", paddingVertical: 3, alignItems: "center" },
  tableHeadRight: { flex: 278, paddingVertical: 3, alignItems: "center" },
  tableHeadText: { fontWeight: 700, fontSize: FS_HEAD },
  tableBody: { flexDirection: "row" },
  tableLeft: { flex: 722, borderRight: "0.8pt solid black", padding: 5 },
  tableRight: { flex: 278, paddingVertical: 6, paddingHorizontal: 5, justifyContent: "space-around" },

  // Table body text (14pt)
  bt: { fontSize: FS_BODY },
  btRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 2 },
  btUnder: { borderBottom: "0.5pt solid black", paddingHorizontal: 2, paddingBottom: 1, minHeight: 16 },

  // Signature column
  sigBlock: { alignItems: "center", marginBottom: 6 },
  sigLine: { width: "88%", borderBottom: "0.5pt solid black", height: 22, marginBottom: 2 },
  sigImg: { height: 20, objectFit: "contain" },
  sigLabel: { fontSize: FS_BODY, textAlign: "center" },

  // ผู้บันทึก row (bottom of main table, full-width row with no dividing border)
  recorderRow: { flexDirection: "row", borderTop: "0.8pt solid black", paddingVertical: 3, paddingHorizontal: 5 },

  // Consideration section
  considerWrap: { flexDirection: "row", marginTop: 8 },
  considerLeft: { flex: 1, paddingRight: 6 },
  considerRight: { flex: 1, paddingLeft: 6 },
  considerHead: { fontWeight: 700, fontSize: FS_HEAD, marginBottom: 3 },
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 1 },
  checkText: { fontSize: FS_HEAD },

  // Opinion section (no-border table with 2 equal columns, matching DOCX 4765/9535 ≈ 50%)
  opinionWrap: { flexDirection: "row", marginTop: 6 },
  opinionLeft: { flex: 1, paddingRight: 8, alignItems: "center" },
  opinionRight: { flex: 1, paddingLeft: 8, alignItems: "center" },
  opinionTitle: { fontSize: FS_HEAD, fontWeight: 700, alignSelf: "flex-start" },
  opinionDotLine: { width: "100%", borderBottom: "0.5pt solid black", marginTop: 6, marginBottom: 4, height: 16 },
  opinionSignLine: { flexDirection: "row", alignItems: "flex-end", marginTop: 8, marginBottom: 2 },
  opinionSignUnder: { borderBottom: "0.5pt solid black", height: 16, flex: 1 },
  opinionName: { fontSize: FS_HEAD, textAlign: "center" },
  opinionPos: { fontSize: FS_HEAD, textAlign: "center" },
})

export type StatementPdfData = {
  id: number
  recordDate: string
  recordedBy: string
  subject: string | null
  content: string | null
  incidentAt: string | null
  location: string | null
  considerationMeasures: string[]
  resultMeasures: string[]
  measureNotes: string | null
  studentSignature: string | null
  guardianSignature: string | null
  advisorSignature: string | null
  semester: { name: string; value: number }
  academicYear: { year: number }
  violationCategory: { name: string }
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    classNumber: number
    addressHouseNo: string
    addressMoo: string | null
    addressVillage: string | null
    addressRoad: string | null
    addressSoi: string | null
    addressSubDistrict: string
    addressDistrict: string
    addressProvince: string
    title: { name: string }
    guardians: { firstName: string; lastName: string; relation: { name: string } }[]
    advisors: { slot: number; teacher: { firstName: string; lastName: string; title: { name: string } } }[]
  }
  bond: { deductPoints: number | null } | null
  disciplineTeacher: { firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
  gradeHeadTeacher: { firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
}

// "(   )" = unchecked, "( x )" = checked — avoids glyph issues with checkmark in Sarabun
function CB({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={s.checkRow}>
      <Text style={s.checkText}>{checked ? "( x )" : "(   )"}</Text>
      <Text style={[s.checkText, { marginLeft: 4 }]}>{label}</Text>
    </View>
  )
}

function SigBox({ label, url }: { label: string; url?: string | null }) {
  return (
    <View style={s.sigBlock}>
      <View style={s.sigLine}>
        {url ? <Image src={url} style={s.sigImg} /> : null}
      </View>
      <Text style={s.sigLabel}>{label}</Text>
    </View>
  )
}

// Info-row field: label + underlined value
function IFL({ label, value, flex, width, mr }: {
  label: string; value: string; flex?: number; width?: number; mr?: number
}) {
  return (
    <>
      <Text style={[s.infoLabel, { marginRight: 2 }]}>{label}</Text>
      <View style={[s.infoField, flex != null ? { flex } : { width: width ?? 60 }, { marginRight: mr ?? 6 }]}>
        <Text style={s.infoFieldText}>{value}</Text>
      </View>
    </>
  )
}

// Body-row inline underlined field
function BFL({ value, flex, width }: { value: string; flex?: number; width?: number }) {
  return (
    <View style={[s.btUnder, flex != null ? { flex } : { width: width ?? 60 }, { marginHorizontal: 1 }]}>
      <Text style={s.bt}>{value}</Text>
    </View>
  )
}

export function StatementPdf({ record }: { record: StatementPdfData }) {
  const { student } = record
  const inc = thaiDate(record.incidentAt)
  const recDate = thaiDateShort(record.recordDate)

  const father = student.guardians.find((g) =>
    g.relation.name.includes("บิดา") || g.relation.name.includes("พ่อ") || g.relation.name === "father"
  )
  const mother = student.guardians.find((g) =>
    g.relation.name.includes("มารดา") || g.relation.name.includes("แม่") || g.relation.name === "mother"
  )
  const guardian = student.guardians[0]

  const advisor1 = student.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = student.advisors.find((a) => a.slot === 2)?.teacher

  const fatherName   = father   ? `${father.firstName} ${father.lastName}`   : ""
  const motherName   = mother   ? `${mother.firstName} ${mother.lastName}`   : ""
  const guardianName = guardian ? `${guardian.firstName} ${guardian.lastName}` : ""
  const advisor1Name = advisor1 ? `${advisor1.title.name}${advisor1.firstName} ${advisor1.lastName}` : ""
  const advisor2Name = advisor2 ? `${advisor2.title.name}${advisor2.firstName} ${advisor2.lastName}` : ""
  const studentName  = `${student.title.name}${student.firstName} ${student.lastName}`
  const gradeClass   = `${student.gradeLevel}/${student.classRoom}`

  const hasDeductScore = record.resultMeasures.includes("deduct_score")
  const deductPts      = record.bond?.deductPoints ?? null

  const subjectText = record.subject ?? ""
  const contentText = record.content ?? ""

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* บก.1 top-right */}
        <Text style={s.docNo}>บก.1</Text>

        {/* ── Header: logo + title ── */}
        <View style={s.center}>
          <Image src={LOGO_PATH} style={s.logo} />
          <Text style={s.title}>บันทึกการให้ถ้อยคำนักเรียน</Text>
        </View>

        {/* ── Header info rows ── */}
        <View style={{ marginTop: 8 }}>
          {/* Row 1: ข้าพเจ้า */}
          <View style={s.infoRow}>
            <Text style={[s.infoLabel, { marginRight: 2, width: 16 }]}>{" "}</Text>
            <IFL label="ข้าพเจ้า" value={studentName} flex={1} mr={8} />
            <IFL label="เลขประจำตัว" value={student.studentCode} width={75} mr={8} />
            <IFL label="ชั้น" value={gradeClass} width={55} mr={8} />
            <IFL label="เลขที่" value={String(student.classNumber)} width={35} mr={0} />
          </View>

          {/* Row 2: บิดา / มารดา */}
          <View style={s.infoRow}>
            <IFL label="บิดา ชื่อ" value={fatherName} flex={1} mr={10} />
            <IFL label="มารดา ชื่อ" value={motherName} flex={1} mr={0} />
          </View>

          {/* Row 3: ผู้ปกครอง */}
          <View style={s.infoRow}>
            <IFL label="ผู้ปกครองชื่อ" value={guardianName} flex={1} mr={0} />
          </View>

          {/* Row 4: ที่อยู่ */}
          <View style={s.infoRow}>
            <IFL label="ที่อยู่เลขที่" value={student.addressHouseNo} width={52} mr={8} />
            <IFL label="หมู่ที่" value={student.addressMoo ?? ""} width={40} mr={8} />
            <IFL label="หมู่บ้าน" value={student.addressVillage ?? ""} flex={2} mr={8} />
            <IFL label="ถนน" value={student.addressRoad ?? ""} flex={2} mr={0} />
          </View>

          {/* Row 5: ซอย / ตำบล / อำเภอ / จังหวัด — all on same line per original template */}
          <View style={s.infoRow}>
            <IFL label="ซอย" value={student.addressSoi ?? ""} flex={1} mr={8} />
            <IFL label="ตำบล" value={student.addressSubDistrict} flex={1} mr={8} />
            <IFL label="อำเภอ" value={student.addressDistrict} flex={1} mr={8} />
            <IFL label="จังหวัด" value={student.addressProvince} flex={1} mr={0} />
          </View>

          {/* Row 6: ครูที่ปรึกษา */}
          <View style={s.infoRow}>
            <IFL label="ครูที่ปรึกษา (1)" value={advisor1Name} flex={1} mr={8} />
            <IFL label="(2)" value={advisor2Name} flex={1} mr={0} />
          </View>
        </View>

        {/* ── Main table ── */}
        <View style={s.tableWrap}>

          {/* Table header row */}
          <View style={s.tableHead}>
            <View style={s.tableHeadLeft}>
              <Text style={s.tableHeadText}>รายละเอียด</Text>
            </View>
            <View style={s.tableHeadRight}>
              <Text style={s.tableHeadText}>ลงนาม</Text>
            </View>
          </View>

          {/* Table body row */}
          <View style={s.tableBody}>

            {/* LEFT: incident details */}
            <View style={s.tableLeft}>

              {/* ภาคเรียน */}
              <Text style={[s.bt, { marginTop: 4, marginBottom: 2 }]}>
                ภาคเรียนที่  {record.semester.value}   ปีการศึกษา  {record.academicYear.year}
              </Text>

              {/* ข้าพเจ้า นักเรียนชั้น เลขประจำตัว */}
              <View style={[s.btRow, { flexWrap: "wrap", marginBottom: 3 }]}>
                <Text style={s.bt}>ข้าพเจ้า</Text>
                <BFL value={studentName} flex={1} />
                <Text style={[s.bt, { marginLeft: 2 }]}>นักเรียนชั้น</Text>
                <BFL value={gradeClass} width={50} />
                <Text style={[s.bt, { marginLeft: 2 }]}>เลขประจำตัว</Text>
                <BFL value={student.studentCode} width={68} />
              </View>

              {/* หมวด */}
              <View style={[s.btRow, { marginBottom: 2 }]}>
                <Text style={s.bt}>ได้ประพฤติผิดระเบียบของโรงเรียนใน หมวด</Text>
                <BFL value={record.violationCategory.name} flex={1} />
              </View>

              {/* เรื่อง */}
              <View style={[s.btRow, { marginBottom: 1 }]}>
                <Text style={s.bt}>เรื่อง</Text>
                <BFL value={subjectText} flex={1} />
              </View>
              {/* blank line under เรื่อง */}
              <View style={[s.btUnder, { marginBottom: 4 }]}>
                <Text style={s.bt}>{" "}</Text>
              </View>

              {/* ซึ่งมีรายละเอียดการกระผิดระเบียบ คือ */}
              <Text style={[s.bt, { marginTop: 4, marginBottom: 2 }]}>
                ซึ่งมีรายละเอียดการกระผิดระเบียบ คือ
              </Text>
              {contentText
                ? contentText.split("\n").map((line, i) => (
                    <View key={i} style={[s.btUnder, { marginBottom: 2 }]}>
                      <Text style={s.bt}>{line}</Text>
                    </View>
                  ))
                : [0, 1, 2].map((i) => (
                    <View key={i} style={[s.btUnder, { marginBottom: 2 }]}>
                      <Text style={s.bt}>{" "}</Text>
                    </View>
                  ))
              }

              {/* เหตุเกิดเมื่อ */}
              <View style={[s.btRow, { marginTop: 6, marginBottom: 2 }]}>
                <Text style={s.bt}>เหตุเกิดเมื่อ วันที่</Text>
                <BFL value={inc.day}   width={24} />
                <Text style={[s.bt, { marginHorizontal: 2 }]}>เดือน</Text>
                <BFL value={inc.month} width={72} />
                <Text style={[s.bt, { marginHorizontal: 2 }]}>พ.ศ.</Text>
                <BFL value={inc.year}  width={42} />
                <Text style={[s.bt, { marginHorizontal: 2 }]}>เวลา</Text>
                <BFL value={inc.time}  width={36} />
                <Text style={[s.bt, { marginLeft: 1 }]}>น.</Text>
              </View>

              {/* สถานที่เกิดเหตุ */}
              <View style={[s.btRow, { marginBottom: 2 }]}>
                <Text style={s.bt}>สถานที่เกิดเหตุ</Text>
                <BFL value={record.location ?? ""} flex={1} />
              </View>
            </View>

            {/* RIGHT: signatures */}
            <View style={s.tableRight}>
              <SigBox label="นักเรียน"        url={record.studentSignature} />
              <SigBox label="ผู้ปกครอง"       url={record.guardianSignature} />
              <SigBox label="ครูที่ปรึกษา"    url={record.advisorSignature} />
              <SigBox label="หัวหน้าระดับชั้น" url={record.gradeHeadTeacher?.signatureUrl} />
              <SigBox label="ครูฝ่ายปกครอง"  url={record.disciplineTeacher?.signatureUrl} />
            </View>
          </View>

          {/* ผู้บันทึก / ลงวันที่ row — no internal vertical border per DOCX */}
          <View style={s.recorderRow}>
            <Text style={[s.bt, { flex: 1 }]}>ผู้บันทึก :  {record.recordedBy}</Text>
            <Text style={[s.bt, { flex: 1 }]}>ลงวันที่ :  {recDate}</Text>
          </View>
        </View>

        {/* ── Consideration section ── */}
        <View style={s.considerWrap}>
          <View style={s.considerLeft}>
            <Text style={s.considerHead}>การพิจารณา</Text>
            <CB checked={record.considerationMeasures.includes("notify_parent")}
                label="แจ้งผู้ปกครอง" />
            <CB checked={record.considerationMeasures.includes("invite_parent")}
                label="เชิญผู้ปกครองรับทราบพฤติกรรม" />
          </View>
          <View style={s.considerRight}>
            <Text style={s.considerHead}>ผลการพิจารณา (พิจารณาได้มากกว่า 1 ข้อ)</Text>
            <CB checked={record.resultMeasures.includes("verbal_warning")} label="ตักเตือน" />
            <CB
              checked={hasDeductScore}
              label={`ตัดคะแนนความประพฤติ ${hasDeductScore && deductPts ? deductPts : ".........."} คะแนน`}
            />
            <CB checked={record.resultMeasures.includes("behavior_activity")}
                label="ทำกิจกรรมปรับเปลี่ยนพฤติกรรม" />
            <CB checked={record.resultMeasures.includes("probation_bond")} label="ทำทัณฑ์บน" />
          </View>
        </View>

        {/* ── Opinion section (no-border 2-column) ── */}
        <View style={s.opinionWrap}>
          {/* Deputy Director */}
          <View style={s.opinionLeft}>
            <Text style={s.opinionTitle}>ความเห็นรองผู้อำนวยการกลุ่มบริหารทั่วไป</Text>
            <View style={s.opinionDotLine} />
            <View style={[s.opinionDotLine, { marginTop: 0 }]} />
            <View style={s.opinionSignLine}>
              <Text style={[s.bt, { marginRight: 4 }]}>ลงชื่อ</Text>
              <View style={s.opinionSignUnder} />
            </View>
            <Text style={s.opinionName}>(นายจิรภัทร ยศรุ่งเรือง)</Text>
            <Text style={s.opinionPos}>รองผู้อำนวยการกลุ่มบริหารทั่วไป</Text>
          </View>

          {/* Principal */}
          <View style={s.opinionRight}>
            <Text style={s.opinionTitle}>ความเห็นผู้อำนวยการโรงเรียน</Text>
            <View style={s.opinionDotLine} />
            <View style={[s.opinionDotLine, { marginTop: 0 }]} />
            <View style={s.opinionSignLine}>
              <Text style={[s.bt, { marginRight: 4 }]}>ลงชื่อ</Text>
              <View style={s.opinionSignUnder} />
            </View>
            <Text style={s.opinionName}>(นายวิสูตร ยอดสุข)</Text>
            <Text style={s.opinionPos}>ผู้อำนวยการโรงเรียนบางพลีราษฎร์บำรุง</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
