-- หัวหน้าระดับ ม.5: นาย วิชัย ก้าวหน้า
-- login: wichai / wichai123
BEGIN;

INSERT INTO teacher_titles (name) VALUES ('นาย') ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (
  created_at, updated_at,
  title_id, first_name, last_name, phone,
  address_house_no, address_moo,
  address_sub_district, address_district, address_province, address_postal_code,
  role, grade_head_level
)
SELECT
  NOW(), NOW(),
  (SELECT id FROM teacher_titles WHERE name = 'นาย'),
  'วิชัย', 'ก้าวหน้า', '0810000005',
  '25', '3',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'TEACHER', 'ม.5'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'วิชัย' AND last_name = 'ก้าวหน้า'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'wichai',
  'f24ea03e7bcc3071c2eda58845dba0c5:c056dc1641beb51b2a715df46c5e17625a7d3224c3c0dfdb6bf1437c6a82163da3b125b22d89755c95aea748728e18ae4920e103563ff993fb854cf6340f14b7',
  (SELECT id FROM teachers WHERE first_name = 'วิชัย' AND last_name = 'ก้าวหน้า')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'wichai');

COMMIT;
