-- รองผู้อำนวยการ: นาง สุรีย์ มีสุข
-- login: suree / suree123
BEGIN;

INSERT INTO teacher_titles (name) VALUES ('นาง') ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (
  created_at, updated_at,
  title_id, first_name, last_name, phone,
  address_house_no, address_moo,
  address_sub_district, address_district, address_province, address_postal_code,
  role
)
SELECT
  NOW(), NOW(),
  (SELECT id FROM teacher_titles WHERE name = 'นาง'),
  'สุรีย์', 'มีสุข', '0892222222',
  '55', '1',
  'บางโฉลง', 'บางพลี', 'สมุทรปราการ', '10540',
  'VICE_DIRECTOR'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'สุรีย์' AND last_name = 'มีสุข'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'suree',
  '8c79ba4f637dcef76d1f335b529c65e7:abf9bada03a673954f1588e056b87f5c297c1843dc79c545b73a5eee9053b316479232b8cdc3a5f7920b9dbbbe26b625434ea8838467677d2089007ca70a4c5b',
  (SELECT id FROM teachers WHERE first_name = 'สุรีย์' AND last_name = 'มีสุข')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'suree');

COMMIT;
