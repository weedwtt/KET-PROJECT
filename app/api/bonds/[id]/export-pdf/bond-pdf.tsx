import React from "react"
import { Document, Page, View, Text as PdfText, Image, StyleSheet, Font } from "@react-pdf/renderer"
import path from "path"
import fs from "fs"

// SARA AM (ำ, U+0E33) causes react-pdf to mis-count glyphs and drop trailing characters.
// Pre-decompose to nikhahit + sara aa so the glyph count stays consistent.
function fixThai(s: string) {
  return s.replace(/ำ/g, "ํา")
}
function Text({ children, ...props }: React.ComponentProps<typeof PdfText> & { children?: React.ReactNode }) {
  const fixed = typeof children === "string" ? fixThai(children) : children
  return <PdfText {...props}>{fixed}</PdfText>
}

function b64(relative: string, mime: string): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), relative))
    return `data:${mime};base64,${buf.toString("base64")}`
  } catch {
    return ""
  }
}

Font.register({
  family: "Sarabun",
  fonts: [
    { src: b64("public/fonts/Sarabun-Regular.ttf", "font/truetype") },
    { src: b64("public/fonts/Sarabun-Bold.ttf", "font/truetype"), fontWeight: "bold" },
  ],
})

Font.registerHyphenationCallback((w) => [w])

const LOGO_SRC = b64("public/school-logo.png", "image/png")
const BORDER = { borderBottomWidth: 0.5, borderColor: "#000" } as const

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 9,
    letterSpacing: 0.5,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 34,
    paddingRight: 34,
  },
  bk6: { position: "absolute", top: 10, right: 14, fontSize: 9 },

  logoWrap: { alignItems: "center", marginBottom: 2 },
  logo: { width: 42, height: 42 },
  title: { fontSize: 13, fontWeight: "bold", textAlign: "center", width: "100%", marginBottom: 4, paddingHorizontal: 20 },

  schoolRight: { alignItems: "flex-end", marginBottom: 4 },
  schoolText: { fontSize: 9 },
  dateRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 2, width: 270 },

  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  lbl: { fontSize: 9, flexShrink: 0, paddingRight: 3 },
  fill: { ...BORDER, flexShrink: 0 },
  val: { fontSize: 9, paddingHorizontal: 3, textAlign: "center" },

  para: { fontSize: 9, marginBottom: 2 },

  chkSection: { marginTop: 4, marginBottom: 4, alignItems: "center" },
  chkGroup: { alignItems: "flex-start" },
  chkRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  chkOuter: {
    width: 9, height: 9, borderWidth: 0.7, borderColor: "#000",
    marginRight: 4, flexShrink: 0, alignItems: "center", justifyContent: "center",
  },
  chkInner: { width: 5.5, height: 5.5, backgroundColor: "#000" },
  chkLabel: { fontSize: 9 },

  sigSection: { flexDirection: "row", marginTop: 8, marginBottom: 4 },
  sigCol: { flex: 1, flexDirection: "column" },
  sigBox: { marginBottom: 10, paddingHorizontal: 8 },
  sigImg: { width: 80, height: 26, objectFit: "contain", alignSelf: "center", marginBottom: 1 },
  sigLineRow: { flexDirection: "row", alignItems: "flex-end" },
  sigLineFill: { flex: 1, ...BORDER },
  sigRole: { fontSize: 8.5, textAlign: "center", marginTop: 2 },

  approvalRow: { flexDirection: "row", marginTop: 6 },
  approvalBox: { flex: 1, paddingHorizontal: 4 },
  approvalTitle: { fontWeight: "bold", fontSize: 8.5, marginBottom: 4 },
  opinionLine: { ...BORDER, height: 12, marginBottom: 4 },
  approvalSigImg: { width: 70, height: 24, objectFit: "contain", alignSelf: "center", marginBottom: 1 },
  approvalSigRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  approvalSigFill: { flex: 1, ...BORDER },
  approvalName: { textAlign: "center", fontSize: 8.5, marginTop: 2 },
  approvalRole: { textAlign: "center", fontSize: 8.5 },
})

export interface BondPDFData {
  id: number
  contractDay: string
  contractMonth: string
  contractYear: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  studentName: string
  studentCode: string
  gradeLevel: string
  classRoom: number | null
  houseNo: string
  moo: string
  village: string
  road: string
  soi: string
  subDistrict: string
  district: string
  province: string
  violationLine1: string
  violationLine2: string
  measureDeductScore: boolean
  measureDeductPoints: number | null
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  guardianSignatureUrl: string | null
  studentSignatureUrl: string | null
  advisorSignatureUrl: string | null
  headTeacherSignatureUrl: string | null
  disciplineTeacherSignatureUrl: string | null
  viceDirectorSignatureUrl: string | null
  viceDirectorName: string
  directorSignatureUrl: string | null
  directorName: string
}

function FillVal({ value, flex, minWidth }: { value: string; flex?: number; minWidth?: number }) {
  return (
    <View style={[s.fill, { flex: flex ?? 1, minWidth: minWidth ?? 0 }]}>
      <Text style={s.val}>{value}</Text>
    </View>
  )
}

function Chk({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={s.chkRow}>
      <View style={s.chkOuter}>
        {checked && <View style={s.chkInner} />}
      </View>
      <Text style={s.chkLabel}>{label}</Text>
    </View>
  )
}

function BondSig({ label, url }: { label: string; url: string | null }) {
  return (
    <View style={s.sigBox}>
      {url ? <Image src={url} style={s.sigImg} /> : <View style={{ height: 26, marginBottom: 1 }} />}
      <View style={s.sigLineRow}>
        <Text style={{ fontSize: 8, flexShrink: 0 }}>ลงชื่อ</Text>
        <View style={s.sigLineFill} />
        <Text style={{ fontSize: 8.5, flexShrink: 0 }}>{label}</Text>
      </View>
    </View>
  )
}

export function BondPDF({ data: d }: { data: BondPDFData }) {
  const gradeClass = [d.gradeLevel, d.classRoom].filter(Boolean).join("/")
  const deductLabel = d.measureDeductScore && d.measureDeductPoints
    ? `ตัดคะแนนความประพฤติ ${d.measureDeductPoints} คะแนน`
    : "ตัดคะแนนความประพฤติ.......... คะแนน"

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.bk6}>บก.6</Text>

        {/* Logo */}
        <View style={s.logoWrap}>
          {LOGO_SRC ? <Image src={LOGO_SRC} style={s.logo} /> : null}
        </View>

        {/* Title */}
        <Text style={s.title}>บันทึกทัณฑ์บน</Text>

        {/* School info right-aligned */}
        <View style={s.schoolRight}>
          <Text style={s.schoolText}>โรงเรียนบางพลีราษฎร์บำรุง</Text>
          <Text style={s.schoolText}>อำเภอบางพลี จังหวัดสมุทรปราการ</Text>
          <View style={s.dateRow}>
            <Text style={s.lbl}>วันที่</Text>
            <FillVal value={d.contractDay} flex={0.6} />
            <Text style={[s.lbl, { paddingLeft: 4 }]}>เดือน</Text>
            <FillVal value={d.contractMonth} flex={1.5} />
            <Text style={[s.lbl, { paddingLeft: 4 }]}>พ.ศ.</Text>
            <FillVal value={d.contractYear} flex={0.8} />
          </View>
        </View>

        {/* Row 1: guardian name — student name (paragraph first-line indent) */}
        <View style={[s.row, { paddingLeft: 36 }]}>
          <Text style={s.lbl}>ข้าพเจ้า</Text>
          <FillVal value={d.guardianName} flex={2} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>เป็นผู้ปกครองของ</Text>
          <FillVal value={d.studentName} flex={2} />
        </View>

        {/* Row 2: grade — studentCode — houseNo — moo */}
        <View style={s.row}>
          <Text style={s.lbl}>นักเรียนชั้น</Text>
          <FillVal value={gradeClass} flex={0.7} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>เลขประจำตัว</Text>
          <FillVal value={d.studentCode} flex={0.9} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>ที่อยู่เลขที่</Text>
          <FillVal value={d.houseNo} flex={0.8} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>หมู่ที่</Text>
          <FillVal value={d.moo} flex={0.5} />
        </View>

        {/* Row 3: village — road — soi */}
        <View style={s.row}>
          <Text style={s.lbl}>หมู่บ้าน</Text>
          <FillVal value={d.village} flex={1.5} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>ถนน</Text>
          <FillVal value={d.road} flex={2} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>ซอย</Text>
          <FillVal value={d.soi} flex={2} />
        </View>

        {/* Row 4: subDistrict — district — province */}
        <View style={s.row}>
          <Text style={s.lbl}>ตำบล</Text>
          <FillVal value={d.subDistrict} flex={2} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>อำเภอ</Text>
          <FillVal value={d.district} flex={2} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>จังหวัด</Text>
          <FillVal value={d.province} flex={2} />
        </View>

        {/* Row 5: phone */}
        <View style={s.row}>
          <Text style={s.lbl}>หมายเลขโทรศัพท์ (ที่สามารถติดต่อได้)</Text>
          <FillVal value={d.guardianPhone} flex={4} />
        </View>

        {/* Row 6: relation + violation header (no fill, continues on next line) */}
        <View style={s.row}>
          <Text style={s.lbl}>เกี่ยวข้องเป็น</Text>
          <FillVal value={d.guardianRelation} flex={1} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>ของนักเรียน ได้รับทราบความผิดของนักเรียนที่ได้กระทำไปแล้ว</Text>
        </View>

        {/* Violation detail — line 1 with "คือ" label */}
        <View style={[s.row, { marginBottom: d.violationLine2 ? 3 : 4 }]}>
          <Text style={s.lbl}>คือ</Text>
          <View style={[s.fill, { flex: 1 }]}>
            <Text style={[s.val, { textAlign: "left" }]}>{d.violationLine1}</Text>
          </View>
        </View>

        {/* Violation detail — line 2 (only when content overflows) */}
        {d.violationLine2 ? (
          <View style={[s.row, { marginBottom: 4 }]}>
            <View style={[s.fill, { flex: 1 }]}>
              <Text style={[s.val, { textAlign: "left" }]}>{d.violationLine2}</Text>
            </View>
          </View>
        ) : null}

        {/* Oath paragraph line 1 (indented) */}
        <View style={[s.row, { marginBottom: 2 }]}>
          <Text style={s.para}>{"     เป็นการกระทำที่ไม่เหมาะสมกับสภาพความเป็นนักเรียนอย่างยิ่ง จึงยินยอมทำทัณฑ์บนไว้ให้แก่"}</Text>
        </View>

        {/* Oath paragraph line 2: student name fill */}
        <View style={[s.row, { marginBottom: 2 }]}>
          <Text style={s.lbl}>(ชื่อนักเรียน)</Text>
          <FillVal value={d.studentName} flex={2} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>นักเรียนโรงเรียนบางพลีราษฎร์บำรุง ข้าพเจ้าจะควบคุมดูแล</Text>
        </View>

        {/* Oath paragraph lines 3–6 */}
        <Text style={s.para}>{"และกวดขันให้นักเรียนในความปกครองของข้าพเจ้าไม่ให้ประพฤติเช่นนี้อีกต่อไป อันจะนำความเสื่อมเสียมาสู่"}</Text>
        <Text style={s.para}>{"ตนเอง สถาบันฯ และจะเข้มงวดให้ปฏิบัติตามระเบียบวินัยของโรงเรียนโดยเคร่งครัด หากปรากฎว่าประพฤติ"}</Text>
        <Text style={s.para}>{"ผิดทำนองนี้อีกหรืออย่างอื่นอันเป็นการฝ่าฝนทัณฑ์บนนี้ไม่วากรณีใด ๆ ข้าพเจ้ายินยอมให้โรงเรียนพิจารณา"}</Text>
        <Text style={[s.para, { marginBottom: 2 }]}>{"สภาพการเป็นนักเรียน โดยดำเนินการดังนี้"}</Text>

        {/* Measures checkboxes — left-aligned block, centered as a group */}
        <View style={s.chkSection}>
          <View style={s.chkGroup}>
            <View style={s.chkRow}>
              <View style={s.chkOuter}>
                {d.measureDeductScore && <View style={s.chkInner} />}
              </View>
              <Text style={s.chkLabel}>{deductLabel}</Text>
            </View>
            <Chk checked={d.measureActivity} label="ทำกิจกรรมค่ายปรับพฤติกรรม" />
            <Chk checked={d.measureSuspension} label="พักการเรียน" />
            <Chk checked={d.measureTransfer} label="ย้ายสถานศึกษา" />
          </View>
        </View>

        {/* Signatures — 2-column layout */}
        <View style={s.sigSection}>
          {/* Left: guardian, student */}
          <View style={s.sigCol}>
            <BondSig label="ผู้ปกครอง" url={d.guardianSignatureUrl} />
            <BondSig label="นักเรียน" url={d.studentSignatureUrl} />
          </View>
          {/* Right: advisor, headTeacher, disciplineTeacher */}
          <View style={s.sigCol}>
            <BondSig label="ครูที่ปรึกษา" url={d.advisorSignatureUrl} />
            <BondSig label="หัวหน้าระดับ" url={d.headTeacherSignatureUrl} />
            <BondSig label="ครูฝ่ายปกครอง" url={d.disciplineTeacherSignatureUrl} />
          </View>
        </View>

        {/* Approval boxes */}
        <View style={s.approvalRow}>
          {/* Vice Director */}
          <View style={s.approvalBox}>
            <Text style={s.approvalTitle}>ความเห็นรองผู้อำนวยการกลุ่มบริหารทั่วไป</Text>
            <View style={s.opinionLine} />
            <View style={s.opinionLine} />
            {d.viceDirectorSignatureUrl
              ? <Image src={d.viceDirectorSignatureUrl} style={s.approvalSigImg} />
              : <View style={{ height: 24, marginBottom: 1 }} />}
            <View style={s.approvalSigRow}>
              <Text style={{ fontSize: 8, flexShrink: 0 }}>ลงชื่อ</Text>
              <View style={s.approvalSigFill} />
            </View>
            <Text style={s.approvalName}>{d.viceDirectorName ? `(${d.viceDirectorName})` : "(นายจิรภัทร ยศรุ่งเรือง)"}</Text>
            <Text style={s.approvalRole}>รองผู้อำนวยการกลุ่มบริหารทั่วไป</Text>
          </View>

          {/* Director */}
          <View style={s.approvalBox}>
            <Text style={s.approvalTitle}>ความเห็นผู้อำนวยการโรงเรียน</Text>
            <View style={s.opinionLine} />
            <View style={s.opinionLine} />
            {d.directorSignatureUrl
              ? <Image src={d.directorSignatureUrl} style={s.approvalSigImg} />
              : <View style={{ height: 24, marginBottom: 1 }} />}
            <View style={s.approvalSigRow}>
              <Text style={{ fontSize: 8, flexShrink: 0 }}>ลงชื่อ</Text>
              <View style={s.approvalSigFill} />
            </View>
            <Text style={s.approvalName}>{d.directorName ? `(${d.directorName})` : "(นายวิสูตร ยอดสุข)"}</Text>
            <Text style={s.approvalRole}>ผู้อำนวยการโรงเรียนบางพลีราษฎร์บำรุง</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
