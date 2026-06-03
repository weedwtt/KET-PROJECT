-- ครูทั่วไป: นาย ชาญชัย กล้าหาญ
-- login: chanchai / chanchai123
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
  'ชาญชัย', 'กล้าหาญ', '0898888888',
  '67', '7',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'TEACHER'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'ชาญชัย' AND last_name = 'กล้าหาญ'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'chanchai',
  '4e86ad83ca5eb38ea4c1f319ef76a96c:e6f1513c5691ef15ee4b7285fea56d702c92b5cb43763fb5d77384f1dbeffab838ab6e07842c5a487f973cb8bcac9b99fff447a74d3dc98216ee97872ce67f9f',
  (SELECT id FROM teachers WHERE first_name = 'ชาญชัย' AND last_name = 'กล้าหาญ')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'chanchai');

COMMIT;
