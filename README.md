# SPMB - Next.js + Laragon + MySQL (3 Role)

## Menjalankan
1. Nyalakan Laragon (Start All). Tabel `users` sudah dibuat (database/users.sql, database `spmb`).
2. Buka folder ini di VS Code, lalu di terminal:
   npm install
3. Buka .env.local:
   - DB_NAME=spmb
   - SESSION_SECRET: isi dengan hasil
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
4. npm run dev  -> buka http://localhost:3000

## Akun admin / kepsek
node scripts/hash-password.js PasswordAdmin123
Tempel hash ke database/akun-internal.sql, jalankan di HeidiSQL.

## Bank soal ujian
Jalankan `database/soal-ujian.sql` satu kali di database `spmb` untuk membuat bank soal, pengaturan publikasi, dan tabel hasil ujian. Migrasi mengaktifkan semua soal contoh; admin dapat menonaktifkan atau mengaktifkannya kembali melalui halaman **Soal Ujian**. Calon siswa mengerjakan ujian melalui menu **Tes Seleksi**.

## Portal calon siswa
Jalankan `database/portal-siswa.sql` satu kali di database `spmb` untuk mengaktifkan penyimpanan biodata dan metadata dokumen. Portal siswa menyediakan menu status pendaftaran, biodata, unggah enam dokumen persyaratan, tagihan pembayaran, tes, hasil, dan pengumuman. File dokumen disimpan privat di folder `storage/pendaftaran`, tidak disajikan langsung dari folder publik. Jika tabel `users` lama belum memiliki kolom `nisn`, `whatsapp`, dan `jurusan`, tambahkan kolom tersebut menggunakan perintah yang dicontohkan di `database/users.sql`.

## Tagihan dan pembayaran online
Jalankan `database/tagihan.sql` di database `spmb` setelah migrasi portal siswa. Migrasi ini membuat tabel tagihan dan transaksi online serta menambahkan status pembayaran yang diperlukan. Admin membuka **Tagihan Pembayaran** untuk mengatur nominal dan membuka/menutup tagihan. Tagihan siswa terbit setelah enam berkas wajib lengkap; nominal pada tagihan yang sudah terbit disimpan sebagai snapshot.

Checkout siswa menyediakan QRIS dan Virtual Account BCA, BNI, BRI, Permata, serta CIMB Niaga. Pembayaran diproses melalui Midtrans dan status lunas diperbarui otomatis oleh notifikasi gateway atau pemeriksaan status. Pembayaran online tetap nonaktif sampai kredensial server dikonfigurasi.

1. Buat/aktifkan akun Midtrans dan gunakan Server Key sandbox untuk pengujian.
2. Tambahkan ke `.env.local` (jangan pernah commit Server Key):
   - `MIDTRANS_SERVER_KEY=<server-key>`
   - `MIDTRANS_IS_PRODUCTION=false`
3. Atur URL notifikasi pembayaran di dashboard Midtrans ke `https://<domain-aplikasi>/api/pembayaran/midtrans/notification`. Untuk pengujian lokal, gunakan URL publik sementara yang meneruskan ke aplikasi lokal.
4. Mulai ulang server Next.js. Pastikan dashboard admin menunjukkan Midtrans aktif di lingkungan sandbox, lalu atur nominal dan buka pembayaran.
5. Sebelum menerima pembayaran nyata, ganti Server Key dengan kredensial production dan set `MIDTRANS_IS_PRODUCTION=true`. Pastikan URL notifikasi memakai domain HTTPS production.

Jangan mengaktifkan production dengan kredensial sandbox. Tanpa Server Key yang valid, UI siswa tidak mengizinkan pembuatan transaksi dan tidak menampilkan pembayaran seolah-olah berhasil.

## Portal kepala sekolah
Portal kepala sekolah menyediakan data pendaftar, hasil tes, statistik/laporan, dan monitoring seleksi. Semua ringkasan memakai data aktual database; laporan dapat diunduh sebagai CSV, sementara akses API dibatasi untuk akun dengan role `kepsek`.

## Alur tes
/register -> /login -> dashboard sesuai role -> coba buka dashboard role lain (harus ditolak)
