-- หัวหน้าระดับ ม.4: นางสาว พิมพ์ใจ สมบูรณ์
-- login: pimjai / pimjai123
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
  'พิมพ์ใจ', 'สมบูรณ์', '0810000004',
  '14', '2',
  'บางพลีใหญ่', 'บางพลี', 'สมุทรปราการ', '10540',
  'TEACHER', 'ม.4'
WHERE NOT EXISTS (
  SELECT 1 FROM teachers WHERE first_name = 'พิมพ์ใจ' AND last_name = 'สมบูรณ์'
);

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'pimjai',
  '2170b2fcb2aa71eab3e28ce1f0519256:376ed2335e7fcaa7bcaec3c392a3a91374369e3af557c3d08648d4754a13a37a093f025ecec42cdf801fc76ed3fdb04e1a1a3f231fc7d1c26e403f65a19f94af',
  (SELECT id FROM teachers WHERE first_name = 'พิมพ์ใจ' AND last_name = 'สมบูรณ์')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'pimjai');

COMMIT;
