-- ครูฝ่ายปกครอง: นาย อนันต์ สุขสวัสดิ์
-- login: anan / anan123
BEGIN;

INSERT INTO teacher_titles (name) VALUES ('นาย') ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (
  created_at, updated_at,
  title_id, first_name, last_name, phone,
  address_house_no, address_moo,
  address_sub_district, address_district, address_province, address_postal_code,
  role
)
SELECT
  NOW(), NOW(),
  (SELECT id FROM teacher_titles WHERE name = 'นาย'),
  'อนันต์', 'สุขสวัสดิ์', '0896666666',
  '101', '6',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'DISCIPLINE'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'อนันต์' AND last_name = 'สุขสวัสดิ์'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'anan',
  '012ea40668ffd0c1e530008de287592e:182f837827a0d6177f79fc80e5cd9d08e5f7dd90bcd30b0fed529081004e79f28027644fba49b074fcb9f6212fbcb898746326d36e116f9679c97048695e9742',
  (SELECT id FROM teachers WHERE first_name = 'อนันต์' AND last_name = 'สุขสวัสดิ์')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'anan');

COMMIT;
