-- หัวหน้าระดับ ม.6: นาง สมหมาย ดีใจ
-- login: sommai / sommai123
BEGIN;

INSERT INTO teacher_titles (name) VALUES ('นาง') ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (
  created_at, updated_at,
  title_id, first_name, last_name, phone,
  address_house_no, address_moo,
  address_sub_district, address_district, address_province, address_postal_code,
  role, grade_head_level
)
SELECT
  NOW(), NOW(),
  (SELECT id FROM teacher_titles WHERE name = 'นาง'),
  'สมหมาย', 'ดีใจ', '0810000006',
  '36', '4',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'TEACHER', 'ม.6'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'สมหมาย' AND last_name = 'ดีใจ'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'sommai',
  '88652c5196399d6e09954818b45cdf65:230cb173491ddbd9a3200658f903b269d2b0c051476e1c255469d4496892829b7119dc442e123b75102e07cdfe9d488bc3773d1e707c9b26e900d7f25de1680c',
  (SELECT id FROM teachers WHERE first_name = 'สมหมาย' AND last_name = 'ดีใจ')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'sommai');

COMMIT;
