# Dashboard Admin & Kepsek (dari Figma)

## Isi
- `app/dashboard/_components/DashboardShell.js` + `.module.css` : sidebar, top bar, tombol Logout (dipakai kedua halaman)
- `app/dashboard/admin/page.js` + `admin.module.css` : frame `admin-spmb` (Dashboard Utama)
- `app/dashboard/kepsek/page.js` + `kepsek.module.css` : frame `statistik-laporan-kepsek` (Pusat Analisis & Pelaporan SPMB)

## Langkah pasang
1. Salin folder `app/dashboard` ke project (timpa `admin/page.js` dan `kepsek/page.js`).
   Backup dulu file lama, karena pengecekan sesi/role di dalamnya perlu dipindahkan (lihat komentar PENTING di tiap page.js).
2. Install ikon: `npm install lucide-react`
3. Export dari Figma lalu taruh di `public/dashboard-assets/`:
   - `shield.png` (logo perisai di sidebar)
   - `avatar-admin.png` (foto di frame admin-spmb)
   - `avatar-kepsek.png` (foto di frame statistik-laporan-kepsek)
   Cara: pilih layer gambarnya di Figma, panel Export di kanan, PNG 2x.
4. Font: layout memakai `Inter` dan `Instrument Serif`. Pastikan keduanya sudah dimuat (kemungkinan sudah, karena halaman login kamu memakai keduanya).
5. Logout: `DashboardShell.js` memanggil `POST /api/logout` lalu pindah ke `/login`. Ganti dengan logika Logout yang sudah kamu punya.

## Catatan
- Data (angka KPI, tabel pendaftar, grafik) masih contoh dari desain. Ganti dengan data database di `page.js`.
- Link menu selain Dashboard (Data Pendaftar, dst.) mengarah ke route yang belum ada, jadi akan 404 sampai halamannya dibuat.
- Frame Figma lain yang belum dibuat: data-pendaftar-admin, verifikasi-berkas-admin, jadwal-tes-admin, pengumuman-admin, data-pendaftar-kepsek, hasil-tes-kepsek, monitoring-kepsek, pembayaran-kepsek.
