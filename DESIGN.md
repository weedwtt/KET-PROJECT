---
name: KET Design System
description: ระบบบันทึกความประพฤตินักเรียน — Quiet document UI for Thai school governance
colors:
  indigo: "#2563eb"
  indigo-deep: "#1d4ed8"
  indigo-ink: "#1e3a8a"
  indigo-wash: "#eff5ff"
  indigo-wash-2: "#dbeafe"
  paper: "#f4f6fb"
  paper-2: "#e9edf6"
  surface: "#ffffff"
  surface-2: "#f8fafd"
  surface-sunken: "#eef2f8"
  ink: "#0f172a"
  ink-2: "#475569"
  ink-3: "#7c8aa0"
  ink-4: "#b4c0d4"
  rule: "#e4e9f2"
  rule-2: "#d0d8e6"
  amber: "#d97706"
  amber-wash: "#fde9c8"
  sage: "#059669"
  sage-wash: "#d1fae5"
  rose: "#dc2626"
  rose-wash: "#fee2e2"
typography:
  display:
    fontFamily: "Noto Sans Thai, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Noto Sans Thai, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Noto Sans Thai, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.005em"
  body:
    fontFamily: "Noto Sans Thai, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, Noto Sans Thai, ui-monospace, monospace"
    fontSize: "10.5px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.07em"
rounded:
  sm: "4px"
  md: "6px"
  base: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  page: "28px 32px"
  input-h: "40px"
  row-h: "52px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "#ffffff"
    rounded: "{rounded.base}"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.base}"
    padding: "0 14px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "0 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.base}"
    padding: "0 14px"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.rose}"
    rounded: "{rounded.base}"
    padding: "0 14px"
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px 22px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "0 12px"
  chip-pending:
    backgroundColor: "{colors.amber-wash}"
    textColor: "#92400e"
    rounded: "{rounded.pill}"
    padding: "0 9px"
  chip-approved:
    backgroundColor: "{colors.sage-wash}"
    textColor: "#065f46"
    rounded: "{rounded.pill}"
    padding: "0 9px"
  chip-rejected:
    backgroundColor: "{colors.rose-wash}"
    textColor: "#991b1b"
    rounded: "{rounded.pill}"
    padding: "0 9px"
---

# Design System: KET — ระบบบันทึกความประพฤตินักเรียน

## 1. Overview

**Creative North Star: "The Quiet Document"**

KET is a governance tool — not a product, not a brand. The UI should feel like a well-printed official form: dense but legible, structured without being rigid, authoritative without being cold. Every screen is a document waiting to be filled out, signed, and filed. The interface removes itself from the equation and lets the work speak.

The system serves school staff who are not technology natives. They open this tool to complete a task — recording an incident, approving a statement, printing a contract — then close it. Speed to task and zero ambiguity are the primary values. Delight is not the goal; trust is. A teacher filling out a bond contract at 8 AM does not want animations, gradients, or personality. They want to know where to click.

The color system is restrained: deep indigo as the single accent, tinted gray-blue neutrals for all surfaces, and three semantic status colors (amber, sage, rose) used strictly for workflow state. The typography pairs Noto Sans Thai (the Thai-first sans) with IBM Plex Mono for all numeric data, uppercase labels, and machine-readable fields — a pairing that reads as both approachable and precise.

**Key Characteristics:**
- Document-first density: information over whitespace
- Thai-primary language throughout all labels, copy, and error states
- Single blue accent (indigo) — never doubled or gradient
- Mono for all data: IDs, codes, dates, counts, section labels
- Status chips as the only color beyond neutrals + indigo
- Flat surfaces with hairline borders; shadows only on interactive elevation

## 2. Colors: The Civil Service Palette

Cool blue-gray neutrals with one authoritative indigo. The palette reads like government stationery — professional, predictable, impossible to misread.

### Primary
- **Governance Indigo** (#2563eb): The single interactive accent. Used on primary buttons, active nav items, focus rings, progress indicators, and stat card numbers. Its rarity signals that something is actionable.
- **Indigo Deep** (#1d4ed8): Hover state for primary buttons and indigo elements only. Never used as a default color.
- **Indigo Ink** (#1e3a8a): Used for stat card numbers — the darkest blue, carries authority on light backgrounds.
- **Indigo Wash** (#eff5ff): Selected row backgrounds, student picker active states, measure tags. Communicates "selected" without a border alone.

### Neutral
- **Paper** (#f4f6fb): App shell background — slightly blue-tinted, not pure gray.
- **Paper 2** (#e9edf6): Hover backgrounds, table header backgrounds.
- **Surface** (#ffffff): Card and panel backgrounds. Pure white for hierarchy against paper.
- **Surface 2** (#f8fafd): Slightly lifted surface — input backgrounds within cards, table headers.
- **Ink** (#0f172a): Primary text. Near-black with a blue cast, not pure black.
- **Ink 2** (#475569): Secondary text, sidebar nav labels at rest.
- **Ink 3** (#7c8aa0): Muted labels, placeholder text, eyebrow labels, breadcrumbs.
- **Ink 4** (#b4c0d4): Hairline decorations, disabled states, chevrons, scrollbar thumbs.
- **Rule** (#e4e9f2): Table dividers, card borders, section separators. The foundational hairline.
- **Rule 2** (#d0d8e6): Slightly heavier borders — input borders at rest, card borders when emphasis needed.

### Status (Semantic only — not decorative)
- **Amber** (#d97706): Pending approval state. Badge background is amber-wash (#fde9c8).
- **Sage** (#059669): Approved / complete state. Badge background is sage-wash (#d1fae5).
- **Rose** (#dc2626): Rejected / error / destructive actions. Badge background is rose-wash (#fee2e2).

### Named Rules
**The One Accent Rule.** Indigo (#2563eb) is the only non-neutral, non-status color in the interface. It never appears as a gradient, a second hue, or a decorative fill. Its presence always means "interactive" or "selected."

**The Status Purity Rule.** Amber, sage, and rose are reserved exclusively for workflow status (pending / approved / rejected). They do not appear as decorative accents, background fills, or brand elements.

## 3. Typography

**Body Font:** Noto Sans Thai (with system-ui, sans-serif fallback)
**Label / Mono Font:** IBM Plex Mono (with Noto Sans Thai, ui-monospace fallback)
**Serif (decorative only):** IBM Plex Serif — used only in the sidebar crest logotype

**Character:** Noto Sans Thai reads cleanly at small sizes and handles Thai and Latin script equally well — essential for a bilingual school system. IBM Plex Mono anchors all data fields: student codes, record numbers, dates, section dividers, and nav section labels. The pairing is functional-first, with just enough typographic contrast to distinguish data from prose.

### Hierarchy
- **Display** (600, 24px, -0.015em lh 1.2): Page h1 headings only. One per page.
- **Headline** (600, 20px, -0.01em, lh 1.3): Wizard step headings, major section titles.
- **Title** (600, 13.5px, 0.005em, lh 1.4): Card titles, table column group labels, form section names.
- **Body** (400, 14px, normal, lh 1.5): All paragraph text, form field values, table cell content.
- **Label / Eyebrow** (IBM Plex Mono, 500, 10–10.5px, 0.07–0.12em, UPPERCASE): All section dividers, table headers, nav section labels, stat card eyebrows, role indicators. Mono font is mandatory here.

### Named Rules
**The Mono-for-Data Rule.** Any value that is machine-generated, numeric, or a code (student ID, record number, date, count, status label) uses IBM Plex Mono. Human-written prose (incident description, notes) uses Noto Sans Thai. Never mix within the same typographic role.

**The Uppercase-Only-with-Mono Rule.** Text-transform: uppercase is only applied alongside the mono font and at ≤11px. Never uppercase a Thai-primary body text label.

## 4. Elevation

This system is flat by default. Surfaces at rest carry no shadow — depth is expressed through background color layering (paper → surface → surface-2) and hairline borders (--rule, --rule-2). Shadows appear only as response to interaction state.

### Shadow Vocabulary
- **Interactive hover** (`0 4px 16px color-mix(in srgb, #2563eb 8%, transparent)`): Stat card hover only. Indigo-tinted diffuse glow — barely perceptible.
- **Button primary** (`0 1px 3px rgba(37,99,235,.25)`): Primary button resting state. Minimal lift.
- **Button primary hover** (`0 2px 6px rgba(37,99,235,.35)`): Slightly more lift on primary button hover.
- **Sidebar crest** (`0 2px 6px color-mix(in srgb, #2563eb 40%, transparent)`): Icon badge shadow only.

### Named Rules
**The Flat-By-Default Rule.** No surface carries a shadow at rest. Shadows are a state response (hover, focus, lifted). If you're adding a shadow to a static card, it's the wrong call — use a border instead.

**The Indigo-Tint-Only Rule.** All shadows use indigo as their tint color, never black. `rgba(0,0,0,...)` shadows are prohibited. Use `color-mix(in srgb, var(--indigo) N%, transparent)` or `rgba(37,99,235,...)`.

## 5. Components

### Buttons
Clean, minimal, no icon-by-default. Height 40px (--input-h), font-size 13px, font-weight 500, letter-spacing 0.01em.

- **Shape:** Gently rounded (8px / var(--radius))
- **Primary:** Governance Indigo (#2563eb) fill, white text, 1px indigo border. Hover: Indigo Deep (#1d4ed8), stronger shadow. Active: translateY(0.5px).
- **Secondary:** White surface, Ink text, Rule-2 border. Hover: Paper 2 background.
- **Ghost:** Transparent, Ink 2 text. Hover: Paper 2 background. Used for low-prominence actions.
- **Danger:** White surface, Rose text, Rule-2 border. Hover: Rose wash background, rose border.
- **Small variant:** Height 32px, font-size 12px.
- **Focus:** 3px indigo ring at 15% opacity (focus-visible only).

### Status Chips
Pill-shaped (border-radius: 999px), height 22px, font-size 11.5px. Each has a 5px circular dot prefix matching the status color.

- **Pending:** Amber wash background (#fde9c8), dark amber text (#92400e), amber dot.
- **Approved:** Sage wash background (#d1fae5), dark sage text (#065f46), sage dot.
- **Draft:** Paper 2 background, Ink 2 text, Ink 4 dot.
- **Rejected:** Rose wash background (#fee2e2), dark rose text (#991b1b), rose dot.

### Cards
Background: Surface (white). Border: 1px solid Rule (#e4e9f2). Border-radius: 12px (calc(var(--radius) × 1.5)). No shadow at rest.

- **Card header:** 14px vertical padding, 22px horizontal, bottom border (Rule). Title is 13.5px/600.
- **Card body padding:** 20px vertical, 22px horizontal.
- **Stat card:** Same shape, adds hover shadow (indigo-tinted). Stat number in IBM Plex Mono, 40px/400, Indigo Ink color.

### Inputs / Fields
Height 40px, border 1px solid Rule-2, background: Surface, border-radius 8px, font-size 13.5px.

- **Focus:** Border shifts to Indigo, 3px Indigo-15% ring.
- **Placeholder:** Ink 4 color.
- **Textarea:** Same border/focus, min-height 88px, resize vertical.
- **Select:** Custom chevron arrow (SVG inline), padding-right 32px.
- **Field label:** 12px/500, Ink 2, 5px margin-bottom. Required indicator: Rose asterisk.

### Navigation (Sidebar)
Fixed 260px width, collapsible to 60px. Background: Surface. Right border: 1px Rule.

- **Nav item at rest:** Transparent background, Ink 2 text, 13px.
- **Nav item hover:** Paper 2 background, Ink text.
- **Nav item active:** Indigo Wash background, Indigo Ink text, 500 weight. Left edge: 3px Indigo bar (absolute, border-radius 0 3px 3px 0).
- **Nav section label:** IBM Plex Mono, 9.5px, 0.12em tracking, UPPERCASE, Ink 4.
- **Badge:** Amber background, white text, Mono font, 10px, pill shape.

### Tables (Signature component)
The primary data surface. Full-width, border-collapse.

- **Header:** Surface-2 background, Ink 3 text, 10.5px Mono, UPPERCASE, 0.07em tracking. 11px vertical padding, 14px horizontal. Bottom border: Rule.
- **Row:** Height 52px (--row-h), 14px horizontal padding. Bottom border: Rule-soft.
- **Row hover:** Surface-2 background.
- **Clickable rows:** cursor pointer.
- **Mono column:** IBM Plex Mono, 12px, Ink 2 — used for IDs, codes, dates.

### Wizard Stepper
Multi-step form progress indicator. Each step has a 3px tick bar (Paper 2 default, Indigo when current/complete), step number circle (Paper 2 → Indigo when current, Sage when complete), and label text.

## 6. Do's and Don'ts

### Do:
- **Do** use IBM Plex Mono for all numeric data, IDs, codes, and uppercase section labels — this is mandatory, not optional.
- **Do** use status chips (pending/approved/rejected/draft) as the only semantic color beyond indigo. They should only appear when conveying workflow state.
- **Do** keep all label, copy, and error message text in Thai. English is permitted only for proper nouns (role names like "DIRECTOR") and technical codes.
- **Do** use hairline borders (1px, Rule or Rule-2) to separate sections. Borders do the work that shadows are tempted to do.
- **Do** use Indigo Wash (#eff5ff) as the "selected" background for rows, pickers, and active states — never a colored border alone.
- **Do** keep primary button usage to one per view. Multiple primary buttons signal an unclear hierarchy.
- **Do** tint all shadows toward Indigo. Never use `rgba(0,0,0,...)` for shadows.
- **Do** use Page Paper (#f4f6fb) as the app shell background — it creates clear contrast with Surface (white) cards.

### Don't:
- **Don't** use dark mode as the default or primary experience. This is a daytime governance tool used on office screens in light environments.
- **Don't** use animation, glassmorphism, or gradient text. The system should feel like a printed document, not a product landing page.
- **Don't** add social-media-style elements (avatar feeds, notification cards, activity streams). Prominent avatars and card grids with photos are explicitly out of register.
- **Don't** add a second accent color beyond Indigo. If you're tempted to add teal, purple, or orange for variety, use a status chip instead.
- **Don't** uppercase Thai text at body size. Thai script is not designed for all-caps and becomes unreadable. Uppercase + mono is only for English-primary labels at ≤11px.
- **Don't** use `layout that's too complex` — users need to reach their target field within 2 clicks. Nesting and deep navigation hierarchies are prohibited.
- **Don't** use border-left colored stripes as decoration (sidebar active uses one, and that is the only sanctioned use).
- **Don't** add empty states, onboarding flows, or confetti — this is not an activation-oriented product. Users already know what they need to do.
- **Don't** use pure black (#000000) or pure white (#ffffff) for text — use Ink (#0f172a) and Surface (#ffffff) respectively.
