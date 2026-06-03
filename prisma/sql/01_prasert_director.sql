-- ผู้อำนวยการ: ดร.ประเสริฐ วิทยาคม
-- login: prasert / prasert123
BEGIN;

INSERT INTO teacher_titles (name) VALUES ('ดร.') ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (
  created_at, updated_at,
  title_id, first_name, last_name, phone,
  address_house_no, address_moo,
  address_sub_district, address_district, address_province, address_postal_code,
  role
)
SELECT
  NOW(), NOW(),
  (SELECT id FROM teacher_titles WHERE name = 'ดร.'),
  'ประเสริฐ', 'วิทยาคม', '0891111111',
  '99', '3',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'DIRECTOR'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'ประเสริฐ' AND last_name = 'วิทยาคม'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'prasert',
  'fe8ad3d00bb61ed10a86c9dd63fc9960:72bf0dfd191bafd2a2c2a14876238fe2ed05a010ccc1e1cca5cb410e63bdaf03b245b76e0114421d43227a590d852ac905b12c026498009b31165b40d02e04cc',
  (SELECT id FROM teachers WHERE first_name = 'ประเสริฐ' AND last_name = 'วิทยาคม')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'prasert');

COMMIT;
