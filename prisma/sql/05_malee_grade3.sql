-- หัวหน้าระดับ ม.3: นางสาว มาลี ดอกไม้
-- login: malee / malee123
BEGIN;

INSERT INTO teacher_titles (name) VALUES ('นางสาว') ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (
  created_at, updated_at,
  title_id, first_name, last_name, phone,
  address_house_no, address_moo,
  address_sub_district, address_district, address_province, address_postal_code,
  role, grade_head_level
)
SELECT
  NOW(), NOW(),
  (SELECT id FROM teacher_titles WHERE name = 'นางสาว'),
  'มาลี', 'ดอกไม้', '0895555555',
  '34', '4',
  'หนองปรือ', 'บางพลี', 'สมุทรปราการ', '10540',
  'TEACHER', 'ม.3'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'มาลี' AND last_name = 'ดอกไม้'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'malee',
  '98c7fc5f4d0bd593d667961cbfd09097:db4eb2adb9330b9a0bed61b60996468db382ad82b3341099f3f10085300f7899005550e866715a62b9d116e22c3d3ca1279dbe461c41f28c281faed48ef5b4ac',
  (SELECT id FROM teachers WHERE first_name = 'มาลี' AND last_name = 'ดอกไม้')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'malee');

COMMIT;
