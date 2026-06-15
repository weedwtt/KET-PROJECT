import fs from "fs"
import path from "path"

// ── Asset loading (fonts + logo embedded as data URIs so Chromium never has to
// fetch from disk/network mid-render — critical for reliable serverless output) ──
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

export interface StatementHtmlData {
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
  subCategory: string
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
  directorSignatureUrl: string | null
  viceDirectorSignatureUrl: string | null
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

// A field value sitting on a dotted leader line. `grow` lets it stretch to fill
// the remaining width of the row. `left` left-aligns the value (nicer for a lone
// full-width field where centering looks odd).
function field(value: string, opts: { grow?: number; w?: string; left?: boolean } = {}): string {
  const flex = opts.w ? `flex:0 0 ${opts.w}` : `flex:${opts.grow ?? 1} 1 0`
  const cls = opts.left ? "fill fill-left" : "fill"
  return `<span class="${cls}" style="${flex}"><span class="fv">${esc(value)}</span></span>`
}

function checkbox(checked: boolean, label: string): string {
  // Use an inline SVG tick (not the "✓" glyph — Sarabun has no checkmark glyph,
  // so it renders as a tofu square box in the PDF).
  const mark = checked
    ? `<svg class="tick" viewBox="0 0 14 14" width="11" height="11"><path d="M2 7.5 L5.5 11 L12 3" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : "&nbsp;&nbsp;"
  return `<div class="chk"><span class="box">(&nbsp;${mark}&nbsp;)</span><span>${label}</span></div>`
}

// ช่องความเห็น: ใช้เส้น border-dotted แบบเดียวกับเส้น "ลงชื่อ" — ถ้ามีข้อความให้วางบนเส้นแรก
function opinionText(comment: string | null): string {
  if (!comment || !comment.trim()) {
    return `<div class="op-dline"></div>\n      <div class="op-dline"></div>`
  }
  const text = esc(comment).replace(/\r?\n/g, " ")
  return `<div class="op-dline op-dline-fill">${text}</div>\n      <div class="op-dline"></div>`
}

function sigBlock(role: string, url: string | null): string {
  const img = url ? `<img class="sig-img sig-crop" src="${esc(url)}" />` : ""
  return `
    <div class="sig">
      <div class="sig-line">${img}<span class="sig-prefix">ลงชื่อ</span><span class="sig-dots"></span></div>
      <div class="sig-role">${role}</div>
    </div>`
}

export function renderStatementHtml(d: StatementHtmlData): string {
  const gradeClass = [d.gradeLevel, d.classRoom].filter(Boolean).join("/")
  // Detail block: show content lines, pad to at least 3 dotted lines.
  const contentLines = d.content ? d.content.split(/\r?\n/) : []
  const detailLines = [...contentLines]
  while (detailLines.length < 3) detailLines.push("")
  const detailHtml = detailLines
    .map((line) => `<div class="detail-line"><span class="fv">${esc(line)}</span></div>`)
    .join("")

  const deductLabel =
    `ตัดคะแนนความประพฤติ ${d.deductPoints ? esc(d.deductPoints) : "<span class='dots-inline'></span>"} คะแนน`

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
    font-size: 13px;
    line-height: 1.45;
    color: #000;
    padding: 10mm 14mm;
    position: relative;
  }

  .docno { position: absolute; top: 10mm; right: 14mm; font-size: 13px; }

  .head { text-align: center; }
  .head img { width: 100px; height: 100px; object-fit: contain; }
  .title { font-size: 17px; font-weight: 700; margin-top: 2px; }

  .info { margin-top: 8px; }
  /* flex-start so a label hugs the FIRST line of its field; when a long value
     wraps, the field grows DOWNWARD instead of pushing text up over the row above */
  .row { display: flex; align-items: flex-start; margin-bottom: 6px; }
  .lbl { white-space: nowrap; }
  .fill {
    border-bottom: 1px dotted #999;
    min-height: 17px;
    margin: 0 4px;
    text-align: center;
    /* line-height roomy enough that wrapped Thai (stacked vowels/tone marks)
       doesn't collide line-to-line */
    line-height: 1.5;
    /* long values wrap and grow the field instead of overflowing/overlapping.
       overflow-wrap:anywhere lets Thai (which has no inter-word spaces) break too */
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .fv { display: block; padding: 0 2px; }
  .fill-left { text-align: left; }
  .fill-left .fv { padding-left: 6px; }
  /* multi-line text area with dotted rule guides drawn at each line's baseline
     (radial-gradient dots tiled per text line) so long values flow across the
     prepared lines instead of cramming/overlapping on the first one */
  /* ช่อง "เรื่อง": เส้น border-dotted แบบเดียวกับช่องอื่น (.fill / .detail-line) */
  .ruled {
    flex: 1;
    margin: 0 4px;
    padding: 0 4px;
    border-bottom: 1px dotted #999;
    min-height: 17px;
    line-height: 1.5;
    text-align: left;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .indent { padding-left: 40px; }

  /* main table */
  table.main { width: 100%; border-collapse: collapse; margin-top: 9px; table-layout: fixed; height: 1px; }
  table.main td, table.main th { border: 1px solid #000; vertical-align: top; }
  table.main th { text-align: center; font-weight: 700; padding: 4px; }
  .col-detail { width: 62%; }
  .col-sign { width: 38%; }
  .detail-cell { padding: 7px 8px 8px; }
  /* sign column spreads its blocks across the full row height (driven by the
     taller detail cell). The td height:100% + table height:1px trick makes the
     inner div's height:100% resolve to the actual row height in Chromium. */
  .sign-cell { padding: 7px 8px; height: 100%; }
  .sign-inner { display: flex; flex-direction: column; justify-content: space-between; height: 100%; }
  .dline { display: flex; align-items: flex-start; margin-bottom: 6px; }
  .dline .fill { min-height: 16px; }
  .dtext { margin-bottom: 6px; }
  .detail-line { border-bottom: 1px dotted #999; min-height: 17px; margin-bottom: 8px; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }

  /* signature column */
  .sig { text-align: center; position: relative; }
  /* min-height reserves vertical room for the floated signature image so it stays
     inside its own block instead of spilling up into the header / row above */
  .sig-line { display: flex; align-items: flex-end; justify-content: flex-start; position: relative; min-height: 34px; }
  .sig-prefix { white-space: nowrap; padding-right: 3px; }
  .sig-dots { flex: 1; border-bottom: 1px dotted #999; min-height: 16px; }
  .sig-img {
    position: absolute; bottom: 2px; left: 28px; right: 0;
    margin: auto; max-height: 30px; max-width: 85%; object-fit: contain;
  }
  .sig-role { text-align: center; margin-top: 1px; }

  .foot td { padding: 5px 8px; }
  .foot-inner { display: flex; }
  .foot-inner > span { flex: 1; }

  /* consideration */
  .consider { display: flex; margin-top: 12px; }
  .consider > div { flex: 1; padding-right: 10px; }
  .sec-title { font-weight: 700; margin-bottom: 5px; }
  .chk { display: flex; align-items: baseline; margin-bottom: 5px; padding-left: 8px; }
  .chk .box { white-space: nowrap; padding-right: 6px; }
  .tick { vertical-align: -1px; }
  .dots-inline { display: inline-block; width: 56px; border-bottom: 1px dotted #999; }

  /* opinions */
  .opinions { display: flex; margin-top: 16px; }
  .opinions > div { flex: 1; padding: 0 10px; text-align: center; }
  .op-title { font-weight: 700; text-align: left; margin-bottom: 6px; }
  .op-dline { border-bottom: 1px dotted #999; min-height: 17px; margin-bottom: 8px; }
  /* ความเห็นวางบนเส้น border-dotted เส้นเดียวกับ .op-dline (เหมือนเส้น "ลงชื่อ") */
  .op-dline-fill { text-align: left; padding: 0 3px; line-height: 17px; overflow-wrap: anywhere; word-break: break-word; }
  .op-sign { display: flex; align-items: flex-end; justify-content: center; margin-top: 32px; position: relative; }
  .op-sign .sig-prefix { padding-right: 3px; }
  .op-sign .sig-dots { width: 60%; border-bottom: 1px dotted #999; min-height: 16px; }
  .op-sign img { position: absolute; bottom: -26px; left: 0; right: 0; margin: auto; max-height: 92px; max-width: 92%; object-fit: contain; }
  .op-name { margin-top: 34px; }
</style>
</head>
<body>
  <div class="docno">บก.1</div>

  <div class="head">
    ${LOGO ? `<img src="${LOGO}" />` : ""}
    <div class="title">บันทึกการให้ถ้อยคำนักเรียน</div>
  </div>

  <div class="info">
    <div class="row indent">
      <span class="lbl">ข้าพเจ้า</span>${field(d.studentName, { grow: 4 })}
      <span class="lbl">เลขประจำตัว</span>${field(d.studentCode, { w: "80px" })}
      <span class="lbl">ชั้น</span>${field(gradeClass, { w: "50px" })}
      <span class="lbl">เลขที่</span>${field(String(d.classNumber ?? ""), { w: "40px" })}
    </div>
    <div class="row">
      <span class="lbl">บิดา ชื่อ</span>${field(d.fatherName, { grow: 1 })}
      <span class="lbl">มารดา ชื่อ</span>${field(d.motherName, { grow: 1 })}
    </div>
    <div class="row">
      <span class="lbl">ผู้ปกครองชื่อ</span>${field(d.guardianName, { grow: 1, left: true })}
    </div>
    <div class="row">
      <span class="lbl">ที่อยู่เลขที่</span>${field(d.houseNo, { w: "55px" })}
      <span class="lbl">หมู่ที่</span>${field(d.moo, { w: "42px" })}
      <span class="lbl">หมู่บ้าน</span>${field(d.village, { grow: 2 })}
      <span class="lbl">ถนน</span>${field(d.road, { grow: 2 })}
    </div>
    <div class="row">
      <span class="lbl">ซอย</span>${field(d.soi, { grow: 1 })}
      <span class="lbl">ตำบล</span>${field(d.subDistrict, { grow: 1 })}
      <span class="lbl">อำเภอ</span>${field(d.district, { grow: 1 })}
    </div>
    <div class="row">
      <span class="lbl">จังหวัด</span>${field(d.province, { grow: 1 })}
    </div>
    <div class="row">
      <span class="lbl">ครูที่ปรึกษา (1)</span>${field(d.advisor1, { grow: 1 })}
      <span class="lbl">(2)</span>${field(d.advisor2, { grow: 1 })}
    </div>
  </div>

  <table class="main">
    <colgroup><col class="col-detail" /><col class="col-sign" /></colgroup>
    <thead>
      <tr><th>รายละเอียด</th><th>ลงนาม</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="detail-cell">
          <div class="dtext">ภาคเรียนที่ ${esc(d.semesterValue)}&nbsp;&nbsp;ปีการศึกษา ${esc(d.academicYear)}</div>
          <div class="dline">
            <span class="lbl">ข้าพเจ้า</span>${field(d.studentName, { grow: 1 })}
          </div>
          <div class="dline">
            <span class="lbl">นักเรียนชั้น</span>${field(gradeClass, { grow: 1 })}
            <span class="lbl">เลขประจำตัว</span>${field(d.studentCode, { grow: 1 })}
          </div>
          <div class="dline">
            <span class="lbl">ได้ประพฤติผิดระเบียบของโรงเรียนใน หมวด</span>${field(d.violationCategory, { grow: 1 })}
          </div>
          <div class="dline">
            <span class="lbl">เรื่อง</span><span class="ruled">${esc(d.subCategory || d.subject)}</span>
          </div>
          <div class="dtext" style="margin-top:2px;">ซึ่งมีรายละเอียดการกระทำผิดระเบียบ คือ</div>
          ${detailHtml}
          <div class="dline" style="margin-top:6px;">
            <span class="lbl">เหตุเกิดเมื่อ วันที่</span>${field(d.incidentDay, { w: "32px" })}
            <span class="lbl">เดือน</span>${field(d.incidentMonth, { w: "72px" })}
            <span class="lbl">พ.ศ.</span>${field(d.incidentYear, { w: "46px" })}
            <span class="lbl">เวลา</span>${field(d.incidentTime, { w: "42px" })}
            <span class="lbl">น.</span>
          </div>
          <div class="dline">
            <span class="lbl">สถานที่เกิดเหตุ</span>${field(d.location, { grow: 1 })}
          </div>
        </td>
        <td class="sign-cell">
          <div class="sign-inner">
            ${sigBlock("นักเรียน", d.studentSignatureUrl)}
            ${sigBlock("ผู้ปกครอง", d.guardianSignatureUrl)}
            ${sigBlock("ครูที่ปรึกษา", d.advisorSignatureUrl)}
            ${sigBlock("หัวหน้าระดับชั้น", d.gradeHeadSignatureUrl)}
            ${sigBlock("ครูฝ่ายปกครอง", d.disciplineTeacherSignatureUrl)}
          </div>
        </td>
      </tr>
      <tr class="foot">
        <td colspan="2">
          <div class="foot-inner">
            <span>ผู้บันทึก : ${esc(d.recordedBy)}</span>
            <span>ลงวันที่ : ${esc(d.recordDate)}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="consider">
    <div>
      <div class="sec-title">การพิจารณา</div>
      ${checkbox(d.considerMeasures.includes("notify_parent"), "แจ้งผู้ปกครอง")}
      ${checkbox(d.considerMeasures.includes("invite_parent"), "เชิญผู้ปกครองรับทราบพฤติกรรม")}
    </div>
    <div>
      <div class="sec-title">ผลการพิจารณา (พิจารณาได้มากกว่า 1 ข้อ)</div>
      ${checkbox(d.resultMeasures.includes("verbal_warning"), "ตักเตือน")}
      ${checkbox(d.resultMeasures.includes("deduct_score"), deductLabel)}
      ${checkbox(d.resultMeasures.includes("behavior_activity"), "ทำกิจกรรมปรับเปลี่ยนพฤติกรรม")}
      ${checkbox(d.resultMeasures.includes("probation_bond"), "ทำทัณฑ์บน")}
    </div>
  </div>

  <div class="opinions">
    <div>
      <div class="op-title">ความเห็นรองผู้อำนวยการกลุ่มบริหารทั่วไป</div>
      ${opinionText(d.viceDirectorComment)}
      <div class="op-sign">
        ${d.viceDirectorSignatureUrl ? `<img class="sig-crop" src="${esc(d.viceDirectorSignatureUrl)}" />` : ""}
        <span class="sig-prefix">ลงชื่อ</span><span class="sig-dots"></span>
      </div>
      <div class="op-name">(นายจิรภัทร ยศรุ่งเรือง)</div>
      <div>รองผู้อำนวยการกลุ่มบริหารทั่วไป</div>
    </div>
    <div>
      <div class="op-title">ความเห็นผู้อำนวยการโรงเรียน</div>
      ${opinionText(d.directorComment)}
      <div class="op-sign">
        ${d.directorSignatureUrl ? `<img class="sig-crop" src="${esc(d.directorSignatureUrl)}" />` : ""}
        <span class="sig-prefix">ลงชื่อ</span><span class="sig-dots"></span>
      </div>
      <div class="op-name">(นายวิสูตร ยอดสุข)</div>
      <div>ผู้อำนวยการโรงเรียนบางพลีราษฎร์บำรุง</div>
    </div>
  </div>
</body>
</html>`
}
