-- Jalankan satu kali di database SPMB untuk mengaktifkan bank soal dan hasil ujian.
CREATE TABLE IF NOT EXISTS soal_ujian (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kategori VARCHAR(80) NOT NULL,
    pertanyaan TEXT NOT NULL,
    opsi_a VARCHAR(500) NOT NULL,
    opsi_b VARCHAR(500) NOT NULL,
    opsi_c VARCHAR(500) NOT NULL,
    opsi_d VARCHAR(500) NOT NULL,
    jawaban_benar CHAR(1) NOT NULL,
    CONSTRAINT chk_soal_ujian_jawaban CHECK (jawaban_benar IN ('A', 'B', 'C', 'D'))
);

CREATE TABLE IF NOT EXISTS pengaturan_ujian (
    id TINYINT NOT NULL PRIMARY KEY,
    aktif TINYINT(1) NOT NULL DEFAULT 0
);

INSERT INTO pengaturan_ujian (id, aktif)
VALUES (1, 1)
ON DUPLICATE KEY UPDATE aktif = 1;

CREATE TABLE IF NOT EXISTS hasil_ujian (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    jumlah_soal INT NOT NULL,
    jawaban_benar INT NOT NULL,
    nilai DECIMAL(5,2) NOT NULL,
    jawaban JSON NOT NULL,
    dikumpulkan_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hasil_ujian_user FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Penalaran Numerik', 'Deret angka: 3, 7, 15, 31, ... Angka berikutnya adalah?', '47', '55', '63', '65', 'C'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Deret angka: 3, 7, 15, 31, ... Angka berikutnya adalah?');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Penalaran Numerik', 'Jika 4 buku harganya Rp48.000, berapa harga 7 buku dengan harga satuan yang sama?', 'Rp72.000', 'Rp80.000', 'Rp84.000', 'Rp96.000', 'C'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Jika 4 buku harganya Rp48.000, berapa harga 7 buku dengan harga satuan yang sama?');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Penalaran Numerik', 'Sebuah kelas memiliki 40 siswa. Sebanyak 3/5 siswa mengikuti klub sains. Berapa siswa yang mengikuti klub sains?', '16 siswa', '20 siswa', '24 siswa', '30 siswa', 'C'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Sebuah kelas memiliki 40 siswa. Sebanyak 3/5 siswa mengikuti klub sains. Berapa siswa yang mengikuti klub sains?');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Penalaran Verbal', 'Hubungan kata: TERMOMETER : SUHU = ...', 'Kompas : arah', 'Jam : cahaya', 'Peta : waktu', 'Mikroskop : suara', 'A'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Hubungan kata: TERMOMETER : SUHU = ...');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Penalaran Verbal', 'Lawan kata dari “optimis” adalah ...', 'Kreatif', 'Pesimis', 'Aktif', 'Realistis', 'B'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Lawan kata dari “optimis” adalah ...');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Penalaran Verbal', 'Semua peserta yang rajin berlatih memiliki kemampuan yang meningkat. Rani rajin berlatih. Kesimpulan yang tepat adalah ...', 'Kemampuan Rani meningkat', 'Rani tidak mengikuti latihan', 'Semua peserta bernama Rani', 'Kemampuan Rani selalu sama', 'A'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Semua peserta yang rajin berlatih memiliki kemampuan yang meningkat. Rani rajin berlatih. Kesimpulan yang tepat adalah ...');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Logika', 'Semua anggota klub membaca buku. Dita adalah anggota klub. Pernyataan yang pasti benar adalah ...', 'Dita menulis buku', 'Dita membaca buku', 'Semua pembaca adalah anggota klub', 'Dita memiliki klub sendiri', 'B'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Semua anggota klub membaca buku. Dita adalah anggota klub. Pernyataan yang pasti benar adalah ...');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Logika', 'Hari ini hari Selasa. Hari apakah 10 hari lagi?', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'B'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Hari ini hari Selasa. Hari apakah 10 hari lagi?');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Pemahaman Bacaan', '“Perpustakaan sekolah memperpanjang jam layanan agar siswa memiliki lebih banyak waktu untuk membaca dan belajar.” Tujuan perpanjangan jam layanan adalah ...', 'Mengurangi jumlah buku', 'Memberi lebih banyak waktu untuk membaca dan belajar', 'Memindahkan perpustakaan', 'Membatasi kunjungan siswa', 'B'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = '“Perpustakaan sekolah memperpanjang jam layanan agar siswa memiliki lebih banyak waktu untuk membaca dan belajar.” Tujuan perpanjangan jam layanan adalah ...');
INSERT INTO soal_ujian (kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
SELECT 'Penalaran Numerik', 'Sebuah kegiatan dimulai pukul 08.15 dan berlangsung selama 1 jam 45 menit. Pukul berapa kegiatan berakhir?', '09.45', '10.00', '10.15', '10.30', 'B'
WHERE NOT EXISTS (SELECT 1 FROM soal_ujian WHERE pertanyaan = 'Sebuah kegiatan dimulai pukul 08.15 dan berlangsung selama 1 jam 45 menit. Pukul berapa kegiatan berakhir?');
