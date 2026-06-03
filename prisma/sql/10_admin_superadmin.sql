-- Super Admin (ไม่มี teacher) — สิทธิ์สูงสุด
-- login: admin / admin123
BEGIN;

INSERT INTO users (created_at, updated_at, username, password_hash, teacher_id)
SELECT
  NOW(), NOW(),
  'admin',
  '47eedf8113c21b7100e373addadfa1a1:5e12a1a319880b24859a75fd53c67882084fa5c16be172f1a7596e27d1bcac48c5680cf51e514ac14542a839fc8c4c91f2649b81041601ebbea3144b1338e922',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

COMMIT;
