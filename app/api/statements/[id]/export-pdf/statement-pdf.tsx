import React from "react"
import { Document, Page, View, Text as PdfText, Image, StyleSheet, Font } from "@react-pdf/renderer"
import path from "path"
import fs from "fs"

// SARA AM (ำ, U+0E33) is the one Thai code point the react-pdf shaper splits
// into two glyphs (nikhahit + sara aa) but then miscounts, truncating trailing
// content by one position per "ำ" in the run (e.g. "...บำรุง" → "...บำรุ").
// Pre-decomposing it to the explicit two-code-point form keeps the glyph count
// consistent so nothing is dropped. It renders identically — ำ *is* ํ + า.
function fixThai(s: string) {
  return s.replace(/ำ/g, "ํา")
}
function Text({ children, ...props }: React.ComponentProps<typeof PdfText> & { children?: React.ReactNode }) {
  const fixed = typeof children === "string" ? fixThai(children) : children
  return <PdfText {...props}>{fixed}</PdfText>
}

// Read any public asset as a base64 data URL — avoids file:// fetch issues in Node.js
function b64(relative: string, mime: string): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), relative))
    return `data:${mime};base64,${buf.toString("base64")}`
  } catch {
    return ""
  }
}

// Fonts embedded as base64 so renderToBuffer never needs to fetch file:// URLs
Font.register({
  family: "Sarabun",
  fonts: [
    { src: b64("public/fonts/Sarabun-Regular.ttf", "font/truetype") },
    { src: b64("public/fonts/Sarabun-Bold.ttf", "font/truetype"), fontWeight: "bold" },
  ],
})

// Thai has no inter-word spaces; the default word-splitter mis-measures runs and
// drops the trailing glyph cluster. Treating each token as atomic prevents that.
Font.registerHyphenationCallback((w) => [w])

const LOGO_SRC = b64("public/school-logo.png", "image/png")

const BORDER = { borderBottomWidth: 0.5, borderColor: "#000" } as const

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 9,
    // letterSpacing maps to PDFKit charSpacing — adds trailing space after every
    // character INCLUDING the last one, preventing Thai glyph ink from being
    // clipped at the container boundary (น, ว, ป, ง etc.)
    letterSpacing: 0.5,
    paddingTop: 14,
    paddingBottom: 16,
    paddingLeft: 32,
    paddingRight: 32,
  },
  bk1: { position: "absolute", top: 10, right: 14, fontSize: 9 },

  logoWrap: { alignItems: "center", marginBottom: 2 },
  logo: { width: 44, height: 44 },
  // paddingHorizontal: 20 gives room on both sides so last char is never clipped
  title: { fontSize: 13, fontWeight: "bold", textAlign: "center", width: "100%", marginBottom: 8, paddingHorizontal: 20 },

  // Header form rows
  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  // paddingRight: 6 prevents label ink from bleeding into adjacent flex element
  lbl: { fontSize: 9, flexShrink: 0, paddingRight: 6 },
  fill: { ...BORDER, flexShrink: 0 },
  val: { fontSize: 9, paddingHorizontal: 4, textAlign: "center" },

  // Table
  table: { borderWidth: 1, borderColor: "#000", marginTop: 6 },
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  tHLeft: {
    flex: 62, textAlign: "center", fontWeight: "bold", fontSize: 9,
    paddingVertical: 3, paddingHorizontal: 5, borderRightWidth: 1, borderColor: "#000",
  },
  tHRight: {
    flex: 38, textAlign: "center", fontWeight: "bold", fontSize: 9,
    paddingVertical: 3, paddingHorizontal: 5,
  },
  tBody: { flexDirection: "row" },
  tLeft: { flex: 62, paddingTop: 5, paddingBottom: 4, paddingLeft: 5, paddingRight: 8, borderRightWidth: 1, borderColor: "#000" },
  tRight: { flex: 38, paddingVertical: 8, paddingHorizontal: 6, alignItems: "center" },
  tFoot: {
    flexDirection: "row", borderTopWidth: 1, borderColor: "#000",
    paddingVertical: 3, paddingLeft: 5, paddingRight: 5,
  },

  // Rows inside table left col
  tRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  tLbl: { fontSize: 9, flexShrink: 0, paddingRight: 6 },
  tFill: { ...BORDER, flexShrink: 0 },
  tVal: { fontSize: 9, paddingLeft: 3, paddingRight: 6 },
  // Centered variant for fill-in field values
  tValC: { fontSize: 9, paddingHorizontal: 3, textAlign: "center" },
  tText: { fontSize: 9, marginBottom: 3 },
  blankUnderline: { ...BORDER, height: 12, marginBottom: 3, width: "100%" },
  // Evenly-spaced writing lines for the free-text "รายละเอียด" block
  contentLine: { ...BORDER, height: 15, marginBottom: 6, justifyContent: "flex-end", width: "100%" },
  blankSpace: { height: 10 },

  // Signature
  sigArea: { alignItems: "center", width: "100%", marginBottom: 8 },
  sigImg: { width: 78, height: 32, objectFit: "contain" },
  sigLineRow: { flexDirection: "row", alignItems: "flex-end", width: "100%", marginTop: 2 },
  sigLineFill: { flex: 1, ...BORDER },
  sigRole: { fontSize: 8, textAlign: "center", width: "100%", marginTop: 1 },

  // Checkboxes
  considRow: { flexDirection: "row", marginTop: 8 },
  considBox: { flex: 1 },
  sectionTitle: { fontWeight: "bold", fontSize: 9, marginBottom: 4 },
  chkRow: { flexDirection: "row", alignItems: "center", marginBottom: 3, paddingLeft: 6 },
  // Drawn as View — Sarabun doesn't include ✓ glyph
  chkOuter: {
    width: 10, height: 10, borderWidth: 0.7, borderColor: "#000",
    marginRight: 5, flexShrink: 0, alignItems: "center", justifyContent: "center",
  },
  chkInner: { width: 6, height: 6, backgroundColor: "#000" },
  chkLabel: { fontSize: 8.5 },

  // Approval
  approvalRow: { flexDirection: "row", marginTop: 10 },
  approvalBox: { flex: 1, paddingLeft: 4, paddingRight: 18 },
  approvalTitle: { fontWeight: "bold", fontSize: 8.5, marginBottom: 5, paddingRight: 6 },
  opinionLine: { ...BORDER, height: 12, marginBottom: 4 },
  // Signature image sitting above the "ลงชื่อ" line, like the grade-head column
  approvalSigImg: { width: 70, height: 24, objectFit: "contain", alignSelf: "center", marginBottom: 1 },
  approvalSigRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  approvalSigFill: { flex: 1, ...BORDER },
  approvalName: { textAlign: "center", fontSize: 8.5, marginTop: 3, paddingHorizontal: 8 },
  approvalRole: { textAlign: "center", fontSize: 8.5, paddingHorizontal: 8 },
})

export interface StatementPDFData {
  id: number
  studentName: string
  studentCode: string
  gradeLevel: string
  classRoom: number | null
  classNumber: number | null
  fatherName: string
  motherName: string
  guardianName: string
  houseNo: string
  moo: string
  village: string
  road: string
  soi: string
  subDistrict: string
  district: string
  province: string
  advisor1: string
  advisor2: string
  semesterValue: string
  academicYear: string
  violationCategory: string
  subject: string
  content: string
  incidentDay: string
  incidentMonth: string
  incidentYear: string
  incidentTime: string
  location: string
  recordedBy: string
  recordDate: string
  considerMeasures: string[]
  resultMeasures: string[]
  deductPoints: string
  studentSignatureUrl: string | null
  guardianSignatureUrl: string | null
  advisorSignatureUrl: string | null
  gradeHeadSignatureUrl: string | null
  disciplineTeacherSignatureUrl: string | null
  approvedBySignatureUrl: string | null
  directorSignatureUrl: string | null
  viceDirectorSignatureUrl: string | null
}

// Value sitting on an underline, stretches to fill available flex space
function FillVal({ value, flex, minWidth }: { value: string; flex?: number; minWidth?: number }) {
  return (
    <View style={[s.fill, { flex: flex ?? 1, minWidth: minWidth ?? 0 }]}>
      <Text style={s.val}>{value}</Text>
    </View>
  )
}

function Sig({ label, url }: { label: string; url: string | null }) {
  return (
    <View style={s.sigArea}>
      {url ? <Image src={url} style={s.sigImg} /> : <View style={{ height: 32 }} />}
      <View style={s.sigLineRow}>
        <Text style={{ fontSize: 8, flexShrink: 0 }}>ลงชื่อ</Text>
        <View style={s.sigLineFill} />
      </View>
      <Text style={s.sigRole}>{label}</Text>
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

// Thin label inside table rows
function TFillVal({ value, flex }: { value: string; flex?: number }) {
  return (
    <View style={[s.tFill, { flex: flex ?? 1 }]}>
      <Text style={s.tValC}>{value}</Text>
    </View>
  )
}

export function StatementPDF({ data: d }: { data: StatementPDFData }) {
  const gradeClass = [d.gradeLevel, d.classRoom].filter(Boolean).join("/")

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.bk1}>บก.1</Text>

        {/* Logo (centered via View) + Title (textAlign center, full width — no clip) */}
        <View style={s.logoWrap}>
          {LOGO_SRC ? <Image src={LOGO_SRC} style={s.logo} /> : null}
        </View>
        <Text style={s.title}>บันทึกการให้ถ้อยคำนักเรียน</Text>

        {/* ── Header form rows ──
            Each row: label | FillVal (value on underline) | ...
            alignItems:"flex-end" keeps labels baseline-aligned with underlines  */}

        {/* Row 1: paddingLeft indent to match original form layout */}
        <View style={[s.row, { paddingLeft: 44 }]}>
          <Text style={s.lbl}>ข้าพเจ้า</Text>
          <FillVal value={d.studentName} flex={2.5} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>เลขประจำตัว</Text>
          <FillVal value={d.studentCode} flex={1} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>ชั้น</Text>
          <FillVal value={gradeClass} flex={0.6} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>เลขที่</Text>
          <FillVal value={String(d.classNumber ?? "")} flex={0.5} />
        </View>

        <View style={s.row}>
          <Text style={s.lbl}>บิดา ชื่อ</Text>
          <FillVal value={d.fatherName} flex={2} />
          <Text style={[s.lbl, { paddingLeft: 6 }]}>มารดา ชื่อ</Text>
          <FillVal value={d.motherName} flex={2} />
        </View>

        <View style={s.row}>
          <Text style={s.lbl}>ผู้ปกครองชื่อ</Text>
          <FillVal value={d.guardianName} flex={4} />
        </View>

        <View style={s.row}>
          <Text style={s.lbl}>ที่อยู่เลขที่</Text>
          <FillVal value={d.houseNo} flex={0.7} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>หมู่ที่</Text>
          <FillVal value={d.moo} flex={0.5} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>หมู่บ้าน</Text>
          <FillVal value={d.village} flex={1.5} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>ถนน</Text>
          <FillVal value={d.road} flex={1.2} />
        </View>

        <View style={s.row}>
          <Text style={s.lbl}>ซอย</Text>
          <FillVal value={d.soi} flex={1.5} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>ตำบล</Text>
          <FillVal value={d.subDistrict} flex={1.8} />
          <Text style={[s.lbl, { paddingLeft: 4 }]}>อำเภอ</Text>
          <FillVal value={d.district} flex={1.8} />
        </View>

        <View style={s.row}>
          <Text style={s.lbl}>จังหวัด</Text>
          <FillVal value={d.province} flex={1.5} />
        </View>

        <View style={s.row}>
          <Text style={s.lbl}>ครูที่ปรึกษา (1)</Text>
          <FillVal value={d.advisor1} flex={2.5} />
          <Text style={[s.lbl, { paddingLeft: 6 }]}>(2)</Text>
          <FillVal value={d.advisor2} flex={2.5} />
        </View>

        {/* ── Main table ── */}
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={s.tHLeft}>รายละเอียด</Text>
            <Text style={s.tHRight}>ลงนาม</Text>
          </View>

          <View style={s.tBody}>
            {/* Left column */}
            <View style={s.tLeft}>
              <Text style={s.tText}>
                {`ภาคเรียนที่ ${d.semesterValue}  ปีการศึกษา ${d.academicYear}`}
              </Text>

              <View style={s.tRow}>
                <Text style={s.tLbl}>ข้าพเจ้า</Text>
                <TFillVal value={d.studentName} flex={1} />
              </View>

              <View style={s.tRow}>
                <Text style={s.tLbl}>นักเรียนชั้น</Text>
                <TFillVal value={gradeClass} flex={1} />
                <Text style={[s.tLbl, { paddingLeft: 6 }]}>เลขประจำตัว</Text>
                <TFillVal value={d.studentCode} flex={1} />
              </View>

              <View style={s.tRow}>
                <Text style={s.tLbl}>ได้ประพฤติผิดระเบียบของโรงเรียนใน หมวด</Text>
                <TFillVal value={d.violationCategory} flex={1} />
              </View>

              <View style={s.tRow}>
                <Text style={s.tLbl}>เรื่อง</Text>
                <TFillVal value={d.subject} flex={3} />
              </View>
              {/* extra blank subject line */}
              <View style={s.blankUnderline} />

              <Text style={[s.tText, { marginTop: 2 }]}>
                ซึ่งมีรายละเอียดการกระทำผิดระเบียบ คือ
              </Text>

              {/* Content: show text on first line(s), pad to 3 evenly-spaced lines */}
              {(() => {
                const lines = d.content ? d.content.split(/\n/) : [""]
                // show at most 3 lines total
                const display = [...lines, "", ""].slice(0, 3)
                return display.map((line, i) => (
                  <View key={i} style={s.contentLine}>
                    <Text style={s.tVal}>{line}</Text>
                  </View>
                ))
              })()}

              <View style={s.blankSpace} />

              <View style={s.tRow}>
                <Text style={s.tLbl}>เหตุเกิดเมื่อ วันที่</Text>
                <TFillVal value={d.incidentDay} flex={0.4} />
                <Text style={[s.tLbl, { paddingLeft: 3 }]}>เดือน</Text>
                <TFillVal value={d.incidentMonth} flex={1} />
                <Text style={[s.tLbl, { paddingLeft: 3 }]}>พ.ศ.</Text>
                <TFillVal value={d.incidentYear} flex={0.5} />
                <Text style={[s.tLbl, { paddingLeft: 3 }]}>เวลา</Text>
                <TFillVal value={d.incidentTime} flex={0.5} />
                <Text style={[s.tLbl, { paddingLeft: 3 }]}>น.</Text>
              </View>

              <View style={s.tRow}>
                <Text style={s.tLbl}>สถานที่เกิดเหตุ</Text>
                <TFillVal value={d.location} flex={3} />
              </View>
            </View>

            {/* Right column — signatures */}
            <View style={s.tRight}>
              <Sig label="นักเรียน" url={d.studentSignatureUrl} />
              <Sig label="ผู้ปกครอง" url={d.guardianSignatureUrl} />
              <Sig label="ครูที่ปรึกษา" url={d.advisorSignatureUrl} />
              <Sig label="หัวหน้าระดับชั้น" url={d.gradeHeadSignatureUrl} />
              <Sig label="ครูฝ่ายปกครอง" url={d.disciplineTeacherSignatureUrl} />
            </View>
          </View>

          {/* Footer */}
          <View style={s.tFoot}>
            <Text style={{ fontSize: 9 }}>{`ผู้บันทึก : ${d.recordedBy}`}</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 9 }}>{`ลงวันที่ : ${d.recordDate}`}</Text>
          </View>
        </View>

        {/* ── Checkboxes ── */}
        <View style={s.considRow}>
          <View style={s.considBox}>
            <Text style={s.sectionTitle}>การพิจารณา</Text>
            <Chk checked={d.considerMeasures.includes("notify_parent")} label="แจ้งผู้ปกครอง" />
            <Chk
              checked={d.considerMeasures.includes("invite_parent")}
              label="เชิญผู้ปกครองรับทราบพฤติกรรม"
            />
          </View>
          <View style={s.considBox}>
            <Text style={s.sectionTitle}>ผลการพิจารณา (พิจารณาได้มากกว่า 1 ข้อ)</Text>
            <Chk checked={d.resultMeasures.includes("verbal_warning")} label="ตักเตือน" />
            <View style={s.chkRow}>
              <View style={s.chkOuter}>
                {d.resultMeasures.includes("deduct_score") && <View style={s.chkInner} />}
              </View>
              <Text style={s.chkLabel}>
                {`ตัดคะแนนความประพฤติ ${d.deductPoints || "........."} คะแนน`}
              </Text>
            </View>
            <Chk
              checked={d.resultMeasures.includes("behavior_activity")}
              label="ทำกิจกรรมปรับเปลี่ยนพฤติกรรม"
            />
            <Chk checked={d.resultMeasures.includes("probation_bond")} label="ทำทัณฑ์บน" />
          </View>
        </View>

        {/* ── Approval ── */}
        <View style={s.approvalRow}>
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
            <Text style={s.approvalName}>(นายจิรภัทร ยศรุ่งเรือง)</Text>
            <Text style={s.approvalRole}>รองผู้อำนวยการกลุ่มบริหารทั่วไป</Text>
          </View>

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
            <Text style={s.approvalName}>(นายวิสูตร ยอดสุข)</Text>
            <Text style={s.approvalRole}>ผู้อำนวยการโรงเรียนบางพลีราษฎร์บำรุง</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
