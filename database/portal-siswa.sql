-- Jalankan satu kali di database spmb untuk mengaktifkan biodata dan berkas calon siswa.
CREATE TABLE IF NOT EXISTS biodata_siswa (
    user_id INT NOT NULL PRIMARY KEY,
    tempat_lahir VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin ENUM('L', 'P') NOT NULL,
    alamat TEXT NOT NULL,
    asal_sekolah VARCHAR(150) NOT NULL,
    nama_orang_tua VARCHAR(100) NOT NULL,
    whatsapp_orang_tua VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_biodata_siswa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS berkas_siswa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    jenis VARCHAR(40) NOT NULL,
    nama_asli VARCHAR(255) NOT NULL,
    nama_simpan VARCHAR(80) NOT NULL UNIQUE,
    mime_type VARCHAR(40) NOT NULL,
    ukuran INT UNSIGNED NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_berkas_siswa_jenis (user_id, jenis),
    CONSTRAINT fk_berkas_siswa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
