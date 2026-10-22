-- Jalankan satu kali di database spmb untuk mengaktifkan tagihan dan verifikasi pembayaran manual.
CREATE TABLE IF NOT EXISTS pengaturan_pembayaran (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    aktif TINYINT(1) NOT NULL DEFAULT 0,
    nominal BIGINT UNSIGNED NOT NULL DEFAULT 0,
    nama_bank VARCHAR(100) NOT NULL DEFAULT '',
    nomor_rekening VARCHAR(50) NOT NULL DEFAULT '',
    nama_pemilik VARCHAR(150) NOT NULL DEFAULT '',
    instruksi TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO pengaturan_pembayaran (id, aktif, nominal, nama_bank, nomor_rekening, nama_pemilik, instruksi)
VALUES (1, 0, 0, '', '', '', 'Silakan transfer sesuai nominal tagihan dan unggah bukti pembayaran.')
ON DUPLICATE KEY UPDATE id = VALUES(id);

CREATE TABLE IF NOT EXISTS tagihan_pembayaran (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nominal BIGINT UNSIGNED NOT NULL,
    nama_bank VARCHAR(100) NOT NULL,
    nomor_rekening VARCHAR(50) NOT NULL,
    nama_pemilik VARCHAR(150) NOT NULL,
    instruksi TEXT NOT NULL,
    status ENUM('belum_bayar', 'menunggu_pembayaran', 'menunggu_verifikasi', 'ditolak', 'kadaluarsa', 'lunas') NOT NULL DEFAULT 'belum_bayar',
    bukti_nama_asli VARCHAR(255) DEFAULT NULL,
    bukti_nama_simpan VARCHAR(80) DEFAULT NULL,
    bukti_mime VARCHAR(40) DEFAULT NULL,
    bukti_ukuran INT UNSIGNED DEFAULT NULL,
    catatan_admin VARCHAR(500) DEFAULT NULL,
    dikirim_pada TIMESTAMP NULL DEFAULT NULL,
    diverifikasi_pada TIMESTAMP NULL DEFAULT NULL,
    dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    diperbarui_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tagihan_pembayaran_user (user_id),
    UNIQUE KEY uq_tagihan_pembayaran_bukti (bukti_nama_simpan),
    KEY idx_tagihan_pembayaran_status (status, dikirim_pada),
    CONSTRAINT fk_tagihan_pembayaran_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE tagihan_pembayaran
    MODIFY status ENUM('belum_bayar', 'menunggu_pembayaran', 'menunggu_verifikasi', 'ditolak', 'kadaluarsa', 'lunas')
    NOT NULL DEFAULT 'belum_bayar';

CREATE TABLE IF NOT EXISTS transaksi_pembayaran (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tagihan_id BIGINT UNSIGNED NOT NULL,
    user_id INT NOT NULL,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    metode ENUM('qris', 'virtual_account') NOT NULL,
    bank VARCHAR(20) DEFAULT NULL,
    nominal BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'settlement', 'capture', 'expire', 'cancel', 'deny', 'failure', 'refund', 'unknown') NOT NULL DEFAULT 'pending',
    payment_code VARCHAR(100) DEFAULT NULL,
    qr_url VARCHAR(1000) DEFAULT NULL,
    redirect_url VARCHAR(1000) DEFAULT NULL,
    kadaluarsa_pada DATETIME DEFAULT NULL,
    gateway_response JSON DEFAULT NULL,
    dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    diperbarui_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_transaksi_pembayaran_invoice (tagihan_id, id),
    KEY idx_transaksi_pembayaran_user (user_id, id),
    CONSTRAINT fk_transaksi_pembayaran_tagihan FOREIGN KEY (tagihan_id) REFERENCES tagihan_pembayaran(id) ON DELETE CASCADE,
    CONSTRAINT fk_transaksi_pembayaran_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
