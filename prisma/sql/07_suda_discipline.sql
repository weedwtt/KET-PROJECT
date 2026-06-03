-- ครูฝ่ายปกครอง: นางสาว สุดา รุ่งเรือง
-- login: suda / suda123
BEGIN;

INSERT INTO teacher_titles (name) VALUES ('นางสาว') ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (
  created_at, updated_at,
  title_id, first_name, last_name, phone,
  address_house_no, address_moo,
  address_sub_district, address_district, address_province, address_postal_code,
  role
)
SELECT
  NOW(), NOW(),
  (SELECT id FROM teacher_titles WHERE name = 'นางสาว'),
  'สุดา', 'รุ่งเรือง', '0897777777',
  '22', '3',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'DISCIPLINE'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'สุดา' AND last_name = 'รุ่งเรือง'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'suda',
  '35311ed7fb47164be0b0b50f61dd1ac6:c97cfaf0987297ec973e969dea05e1d1a2f2ff1bb6f14db35c004eb5742727d1f9a2e5aeccda2d8502dd19780ea5a7e5c6c8d280d364c609bc68be9b2930b0eb',
  (SELECT id FROM teachers WHERE first_name = 'สุดา' AND last_name = 'รุ่งเรือง')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'suda');

COMMIT;
