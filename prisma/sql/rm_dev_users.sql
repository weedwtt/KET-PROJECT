-- ลบ dev users ทั้งหมด (ใช้หลังทดสอบ)
-- รันซ้ำได้ — idempotent
-- approval_delegates: ลบอัตโนมัติเพราะมี onDelete: Cascade
-- statement_records / bond_records: SET NULL ก่อนเพื่อรักษา records ที่มีอยู่
BEGIN;

-- ── 1. รวบรวม teacher IDs ที่จะลบ ──────────────────────────────────────────
CREATE TEMP TABLE _dev_teacher_ids AS
SELECT teacher_id AS id
FROM users
WHERE username IN (
  'prasert','suree','somchai','wipa','malee',
  'anan','suda','chanchai','thanakorn',
  'pimjai','wichai','sommai'
)
AND teacher_id IS NOT NULL;

-- ── 2. Nullify FK ใน statement_records ─────────────────────────────────────
UPDATE statement_records
SET discipline_teacher_id = NULL
WHERE discipline_teacher_id IN (SELECT id FROM _dev_teacher_ids);

UPDATE statement_records
SET grade_head_teacher_id = NULL
WHERE grade_head_teacher_id IN (SELECT id FROM _dev_teacher_ids);

UPDATE statement_records
SET approved_by_teacher_id = NULL
WHERE approved_by_teacher_id IN (SELECT id FROM _dev_teacher_ids);

UPDATE statement_records
SET signature_teacher_id = NULL
WHERE signature_teacher_id IN (SELECT id FROM _dev_teacher_ids);

-- ── 3. Nullify FK ใน bond_records ──────────────────────────────────────────
UPDATE bond_records
SET head_teacher_id = NULL
WHERE head_teacher_id IN (SELECT id FROM _dev_teacher_ids);

UPDATE bond_records
SET discipline_teacher_id = NULL
WHERE discipline_teacher_id IN (SELECT id FROM _dev_teacher_ids);

UPDATE bond_records
SET approved_by_teacher_id = NULL
WHERE approved_by_teacher_id IN (SELECT id FROM _dev_teacher_ids);

-- ── 4. ลบ student_advisors (NOT NULL — ต้องลบก่อน) ─────────────────────────
DELETE FROM student_advisors
WHERE teacher_id IN (SELECT id FROM _dev_teacher_ids);

-- ── 5. ลบ users (approval_delegates cascade ไปเอง) ──────────────────────────
DELETE FROM users
WHERE username IN (
  'prasert','suree','somchai','wipa','malee',
  'anan','suda','chanchai','thanakorn',
  'pimjai','wichai','sommai',
  'admin'  -- super admin (ไม่มี teacher)
);

-- ── 6. ลบ teachers ──────────────────────────────────────────────────────────
DELETE FROM teachers
WHERE id IN (SELECT id FROM _dev_teacher_ids);

DROP TABLE _dev_teacher_ids;
COMMIT;
