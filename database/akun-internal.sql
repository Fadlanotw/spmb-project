-- Ganti HASH_ADMIN dan HASH_KEPSEK dengan hasil:
--   node scripts/hash-password.js PasswordAdmin123
--   node scripts/hash-password.js PasswordKepsek123
INSERT INTO users (nama, email, password, role)
VALUES ('Petugas SPMB', 'admin@sekolah.com', 'HASH_ADMIN', 'admin');

INSERT INTO users (nama, email, password, role)
VALUES ('Kepala Sekolah', 'kepsek@sekolah.com', 'HASH_KEPSEK', 'kepsek');

-- Cek:
-- SELECT id, nama, email, role FROM users;
