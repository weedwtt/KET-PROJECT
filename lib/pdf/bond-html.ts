import fs from "fs"
import path from "path"

function dataUri(relative: string, mime: string): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), relative))
    return `data:${mime};base64,${buf.toString("base64")}`
  } catch {
    return ""
  }
}

const FONT_REGULAR = dataUri("public/fonts/Sarabun-Regular.ttf", "font/ttf")
const FONT_BOLD = dataUri("public/fonts/Sarabun-Bold.ttf", "font/ttf")
const LOGO = dataUri("public/school-logo.png", "image/png")

export interface BondHtmlData {
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
  viceDirectorComment: string | null
  directorComment: string | null
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// A value sitting on a dotted leader line.
function field(value: string, opts: { grow?: number; w?: string; left?: boolean } = {}): string {
  const flex = opts.w ? `flex:0 0 ${opts.w}` : `flex:${opts.grow ?? 1} 1 0`
  const cls = opts.left ? "fill fill-left" : "fill"
  return `<span class="${cls}" style="${flex}"><span class="fv">${esc(value)}</span></span>`
}

// ช่องความเห็น: ใช้เส้น border-dotted แบบเดียวกับเส้น "ลงชื่อ" — ถ้ามีข้อความให้วางบนเส้นแรก
function opinionText(comment: string | null): string {
  if (!comment || !comment.trim()) {
    return `<div class="op-dline"></div>\n      <div class="op-dline"></div>`
  }
  const text = esc(comment).replace(/\r?\n/g, " ")
  return `<div class="op-dline op-dline-fill">${text}</div>\n      <div class="op-dline"></div>`
}

function checkbox(checked: boolean, label: string): string {
  const mark = checked ? "✓" : "&nbsp;&nbsp;"
  return `<div class="chk"><span class="box">(&nbsp;${mark}&nbsp;)</span><span>${label}</span></div>`
}

// Horizontal signature row: ลงชื่อ [dots + floated sig image] role
function sigRow(role: string, url: string | null): string {
  const img = url ? `<img class="sig-img" src="${esc(url)}" />` : ""
  return `
    <div class="sig-row">
      <span class="lbl">ลงชื่อ</span>
      <span class="sig-fill">${img}</span>
      <span class="lbl">${role}</span>
    </div>`
}

export function renderBondHtml(d: BondHtmlData): string {
  const gradeClass = [d.gradeLevel, d.classRoom].filter(Boolean).join("/")
  const deductLabel = d.measureDeductPoints
    ? `ตัดคะแนนความประพฤติ ${esc(String(d.measureDeductPoints))} คะแนน`
    : `ตัดคะแนนความประพฤติ <span class="dots-inline"></span> คะแนน`

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Sarabun";
    src: url("${FONT_REGULAR}") format("truetype");
    font-weight: 400;
  }
  @font-face {
    font-family: "Sarabun";
    src: url("${FONT_BOLD}") format("truetype");
    font-weight: 700;
  }
  /* margin:0 here + padding on body keeps the on-screen layout width identical
     to the PDF content box, so wrapping/height match exactly */
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body {
    font-family: "Sarabun", sans-serif;
    font-size: 14px;
    line-height: 1.45;
    color: #000;
    padding: 10mm 14mm;
    position: relative;
    /* flex column so .spacer can absorb unused page height;
       min-height = Puppeteer's auto-zoom threshold so spacer fills to page edge
       and shrinks to 0 when content overflows (zoom handles it instead) */
    display: flex;
    flex-direction: column;
    min-height: 1116px;
  }

  .docno { position: absolute; top: 10mm; right: 14mm; font-size: 13px; }

  .head { text-align: center; }
  .head img { width: 100px; height: 100px; object-fit: contain; }
  .title { font-size: 17px; font-weight: 700; margin-top: 2px; }

  /* School name + date — right-justified block */
  .school-right { text-align: right; margin-top: 6px; line-height: 1.8; }
  .date-row { display: flex; justify-content: flex-end; align-items: flex-end; }

  /* flex-start so a label hugs the FIRST line of its field; when a long value
     wraps, the field grows DOWNWARD instead of pushing text up over the row above */
  .row { display: flex; align-items: flex-start; margin-bottom: 8px; }
  .lbl { white-space: nowrap; }
  .fill {
    border-bottom: 1px dotted #999;
    min-height: 19px;
    margin: 0 4px;
    text-align: center;
    /* line-height roomy enough that wrapped Thai (stacked vowels/tone marks)
       doesn't collide line-to-line */
    line-height: 1.5;
    /* long values wrap and grow the field instead of overflowing/overlapping */
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .fv { display: block; padding: 0 2px; }
  .fill-left { text-align: left; }
  .fill-left .fv { padding-left: 6px; }
  .indent { padding-left: 40px; }
  /* justify so wrapped Thai fills the full line width instead of leaving a
     ragged gap on the right; Chrome segments Thai words for break points,
     and the last line stays left-aligned automatically */
  .para { margin-bottom: 6px; text-align: justify; text-justify: inter-character; }
  .dots-inline { display: inline-block; width: 56px; border-bottom: 1px dotted #999; }

  /* Checkbox group — centered on the page */
  .chk-section { margin: 10px 0; display: flex; justify-content: center; }
  .chk-group { display: inline-flex; flex-direction: column; }
  .chk { display: flex; align-items: baseline; margin-bottom: 6px; }
  .chk .box { white-space: nowrap; padding-right: 6px; }

  /* Signature section — 2-column, horizontal rows: ลงชื่อ [dots] role */
  .sig-section { display: flex; margin-top: 16px; }
  .sig-col { flex: 1; }
  .sig-row { display: flex; align-items: flex-end; margin-bottom: 18px; padding: 0 8px; }
  /* Dotted fill area that also hosts the floated signature image */
  .sig-fill {
    flex: 1;
    border-bottom: 1px dotted #999;
    min-height: 32px;
    position: relative;
    margin: 0 4px;
  }
  .sig-img {
    position: absolute;
    bottom: 2px; left: 0; right: 0;
    max-height: 28px;
    object-fit: contain;
  }

  /* Flex spacer: absorbs leftover page height when content is short;
     shrinks to 0 when content is long so auto-zoom can take over */
  .spacer { flex: 1; min-height: 0; }

  /* Approval boxes */
  .approvals { display: flex; margin-top: 6px; }
  .approval-box { flex: 1; padding: 0 8px; }
  .approval-title { font-weight: 700; margin-bottom: 6px; }
  .op-dline { border-bottom: 1px dotted #999; min-height: 17px; margin-bottom: 10px; }
  /* ความเห็นวางบนเส้น border-dotted เส้นเดียวกับ .op-dline (เหมือนเส้น "ลงชื่อ") */
  .op-dline-fill { text-align: left; padding: 0 3px; line-height: 17px; overflow-wrap: anywhere; word-break: break-word; }
  .op-sign { display: flex; align-items: flex-end; justify-content: center; margin-top: 32px; position: relative; }
  .op-sign .lbl { padding-right: 3px; }
  .op-sign .sig-dots { width: 60%; border-bottom: 1px dotted #999; min-height: 16px; }
  .op-sign img { position: absolute; bottom: -18px; max-height: 68px; max-width: 85%; object-fit: contain; }
  .op-name { margin-top: 22px; text-align: center; }
  .op-role { text-align: center; }
</style>
</head>
<body>
  <div class="docno">บก.6</div>

  <div class="head">
    ${LOGO ? `<img src="${LOGO}" />` : ""}
    <div class="title">บันทึกทัณฑ์บน</div>
  </div>

  <div class="school-right">
    <div>โรงเรียนบางพลีราษฎร์บำรุง</div>
    <div>อำเภอบางพลี จังหวัดสมุทรปราการ</div>
    <div class="date-row">
      <span class="lbl">วันที่</span>${field(d.contractDay, { w: "36px" })}
      <span class="lbl">เดือน</span>${field(d.contractMonth, { w: "90px" })}
      <span class="lbl">พ.ศ.</span>${field(d.contractYear, { w: "50px" })}
    </div>
  </div>

  <div style="margin-top:6px;">
    <div class="row indent">
      <span class="lbl">ข้าพเจ้า</span>${field(d.guardianName, { grow: 2 })}
      <span class="lbl">เป็นผู้ปกครองของ</span>${field(d.studentName, { grow: 2 })}
    </div>
    <div class="row">
      <span class="lbl">นักเรียนชั้น</span>${field(gradeClass, { w: "52px" })}
      <span class="lbl">เลขประจำตัว</span>${field(d.studentCode, { w: "68px" })}
      <span class="lbl">ที่อยู่เลขที่</span>${field(d.houseNo, { w: "56px" })}
      <span class="lbl">หมู่ที่</span>${field(d.moo, { w: "38px" })}
    </div>
    <div class="row">
      <span class="lbl">หมู่บ้าน</span>${field(d.village, { grow: 1.5 })}
      <span class="lbl">ถนน</span>${field(d.road, { grow: 2 })}
      <span class="lbl">ซอย</span>${field(d.soi, { grow: 2 })}
    </div>
    <div class="row">
      <span class="lbl">ตำบล</span>${field(d.subDistrict, { grow: 2 })}
      <span class="lbl">อำเภอ</span>${field(d.district, { grow: 2 })}
      <span class="lbl">จังหวัด</span>${field(d.province, { grow: 2 })}
    </div>
    <div class="row">
      <span class="lbl">หมายเลขโทรศัพท์ (ที่สามารถติดต่อได้)</span>${field(d.guardianPhone, { grow: 1, left: true })}
    </div>
    <div class="row">
      <span class="lbl">เกี่ยวข้องเป็น</span>${field(d.guardianRelation, { grow: 1 })}
      <span class="lbl">ของนักเรียน ได้รับทราบความผิดของนักเรียนที่ได้กระทำไปแล้ว</span>
    </div>
    <div class="row">
      <span class="lbl">คือ</span>${field(d.violationLine1, { grow: 1, left: true })}
    </div>
    ${d.violationLine2 ? `<div class="row">${field(d.violationLine2, { grow: 1, left: true })}</div>` : ""}
  </div>

  <div style="margin-top:4px;">
    <div class="para indent">เป็นการกระทำที่ไม่เหมาะสมกับสภาพความเป็นนักเรียนอย่างยิ่ง จึงยินยอมทำทัณฑ์บนไว้ให้แก่</div>
    <div class="row">
      <span class="lbl">(ชื่อนักเรียน)</span>${field(d.studentName, { grow: 1 })}
      <span class="lbl">นักเรียนโรงเรียนบางพลีราษฎร์บำรุง ข้าพเจ้าจะควบคุมดูแล</span>
    </div>
    <div class="para">และกวดขันให้นักเรียนในความปกครองของข้าพเจ้าไม่ให้ประพฤติเช่นนี้อีกต่อไป อันจะนำความเสื่อมเสียมาสู่ตนเอง สถาบันฯ และจะเข้มงวดให้ปฏิบัติตามระเบียบวินัยของโรงเรียนโดยเคร่งครัด หากปรากฎว่าประพฤติผิดทำนองนี้อีกหรืออย่างอื่น<span style="white-space:nowrap">อันเป็นการฝ่าฝืนทัณฑ์บน</span>นี้ไม่วากรณีใด ๆ ข้าพเจ้ายินยอมให้โรงเรียนพิจารณาสภาพการเป็นนักเรียน โดยดำเนินการดังนี้</div>
  </div>

  <div class="chk-section">
    <div class="chk-group">
      ${checkbox(d.measureDeductScore, deductLabel)}
      ${checkbox(d.measureActivity, "ทำกิจกรรมค่ายปรับพฤติกรรม")}
      ${checkbox(d.measureSuspension, "พักการเรียน")}
      ${checkbox(d.measureTransfer, "ย้ายสถานศึกษา")}
    </div>
  </div>

  <div class="sig-section">
    <div class="sig-col">
      ${sigRow("ผู้ปกครอง", d.guardianSignatureUrl)}
      ${sigRow("นักเรียน", d.studentSignatureUrl)}
    </div>
    <div class="sig-col">
      ${sigRow("ครูที่ปรึกษา", d.advisorSignatureUrl)}
      ${sigRow("หัวหน้าระดับ", d.headTeacherSignatureUrl)}
      ${sigRow("ครูฝ่ายปกครอง", d.disciplineTeacherSignatureUrl)}
    </div>
  </div>

  <div class="spacer"></div>

  <div class="approvals">
    <div class="approval-box">
      <div class="approval-title">ความเห็นรองผู้อำนวยการกลุ่มบริหารทั่วไป</div>
      ${opinionText(d.viceDirectorComment)}
      <div class="op-sign">
        ${d.viceDirectorSignatureUrl ? `<img src="${esc(d.viceDirectorSignatureUrl)}" />` : ""}
        <span class="lbl">ลงชื่อ</span><span class="sig-dots"></span>
      </div>
      <div class="op-name">(${esc(d.viceDirectorName || "นายจิรภัทร ยศรุ่งเรือง")})</div>
      <div class="op-role">รองผู้อำนวยการกลุ่มบริหารทั่วไป</div>
    </div>
    <div class="approval-box">
      <div class="approval-title">ความเห็นผู้อำนวยการโรงเรียน</div>
      ${opinionText(d.directorComment)}
      <div class="op-sign">
        ${d.directorSignatureUrl ? `<img src="${esc(d.directorSignatureUrl)}" />` : ""}
        <span class="lbl">ลงชื่อ</span><span class="sig-dots"></span>
      </div>
      <div class="op-name">(${esc(d.directorName || "นายวิสูตร ยอดสุข")})</div>
      <div class="op-role">ผู้อำนวยการโรงเรียนบางพลีราษฎร์บำรุง</div>
    </div>
  </div>
</body>
</html>`
}
