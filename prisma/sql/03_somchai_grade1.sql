-- หัวหน้าระดับ ม.1: นาย สมชาย ใจดี
-- login: somchai / somchai123
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
  'สมชาย', 'ใจดี', '0893333333',
  '12/3', '5',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'TEACHER', 'ม.1'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'สมชาย' AND last_name = 'ใจดี'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'somchai',
  '7f65535aaf6737312c4d35d22df8b81e:674a108de90e09370420a8167cebc12d610675af7f4f271754bc3316ee8938165f956383a4397b4e246b760c8455d68a5fff69f2774fcdb0b8f629a359d4ca12',
  (SELECT id FROM teachers WHERE first_name = 'สมชาย' AND last_name = 'ใจดี')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'somchai');

COMMIT;
