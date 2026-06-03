-- หัวหน้าระดับ ม.2: นาง วิภา รักเรียน
-- login: wipa / wipa123
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
  'วิภา', 'รักเรียน', '0894444444',
  '78', '2',
  'ราชาเทวะ', 'บางพลี', 'สมุทรปราการ', '10540',
  'TEACHER', 'ม.2'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'วิภา' AND last_name = 'รักเรียน'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'wipa',
  '1bfb054c92603ad36193b18ee00c7b56:f8b4e772c7997d4547c9db3b2287764a6c513f0ec478fbdab09b2eeaa8f8a165a1709f218036ef349999e7f564522dd7f9990dc9ef838f5cd8829dab7052caf3',
  (SELECT id FROM teachers WHERE first_name = 'วิภา' AND last_name = 'รักเรียน')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'wipa');

COMMIT;
