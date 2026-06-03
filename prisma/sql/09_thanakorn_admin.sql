-- ผู้ดูแลระบบ: นาย ธนกร ระบบดี
-- login: thanakorn / thanakorn123
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
  'ธนกร', 'ระบบดี', '0899999999',
  '1', '1',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'ADMIN'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'ธนกร' AND last_name = 'ระบบดี'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'thanakorn',
  '8b9fff869856bdf470a1382fc4e39958:b8edf2fca5713254a5389516c3a0d1d866fe7731b0e5b84d33e3f490c06e05dd9cef709cc4e1c2b38b1dd827a6e41ee3d4a0a3ede2ba7a7e11fba5a0a0270aaa',
  (SELECT id FROM teachers WHERE first_name = 'ธนกร' AND last_name = 'ระบบดี')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'thanakorn');

COMMIT;
