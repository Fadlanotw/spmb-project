-- Jalankan di HeidiSQL / phpMyAdmin (Laragon), pada database project SPMB.

-- CARA A: tabel users BELUM ada
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('calon_siswa', 'admin', 'kepsek')
        NOT NULL DEFAULT 'calon_siswa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CARA B: tabel users SUDAH ada (enum 2 pilihan) -> JANGAN CREATE lagi, jalankan ini saja:
-- ALTER TABLE users
-- MODIFY role ENUM('calon_siswa', 'admin', 'kepsek')
-- NOT NULL DEFAULT 'calon_siswa';

-- Cek hasil:
-- DESCRIBE users;
