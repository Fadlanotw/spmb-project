import pool from "@/lib/db";
import { requireKepsekApi } from "@/lib/requireKepsekApi";

const MAJORS = ["PPLG", "MPLB", "PM"];

export async function GET() {
  const auth = await requireKepsekApi();
  if (auth.response) return auth.response;

  try {
    const [[totals]] = await pool.execute(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN b.user_id IS NOT NULL THEN 1 ELSE 0 END) AS biodata_lengkap
       FROM users u LEFT JOIN biodata_siswa b ON b.user_id = u.id
       WHERE u.role = 'calon_siswa'`
    );
    const [[documentStats]] = await pool.execute(
      `SELECT COUNT(*) AS total_dengan_berkas,
         SUM(CASE WHEN jumlah_berkas >= 6 THEN 1 ELSE 0 END) AS berkas_lengkap
       FROM (
         SELECT u.id, COUNT(DISTINCT d.jenis) AS jumlah_berkas
         FROM users u LEFT JOIN berkas_siswa d ON d.user_id = u.id
         WHERE u.role = 'calon_siswa' GROUP BY u.id
       ) registration_docs`
    );
    const [[examStats]] = await pool.execute(
      `SELECT COUNT(DISTINCT h.user_id) AS sudah_mengerjakan,
         COUNT(h.id) AS jumlah_pengerjaan,
         AVG(h.nilai) AS rata_rata_nilai,
         SUM(CASE WHEN h.nilai >= 70 THEN 1 ELSE 0 END) AS di_atas_standar,
         MIN(h.nilai) AS nilai_terendah,
         MAX(h.nilai) AS nilai_tertinggi
       FROM hasil_ujian h
       JOIN users u ON u.id = h.user_id AND u.role = 'calon_siswa'`
    );
    const [[examSetting]] = await pool.execute(
      "SELECT aktif FROM pengaturan_ujian WHERE id = 1"
    );
    const [majorRows] = await pool.execute(
      `SELECT u.jurusan, COUNT(u.id) AS jumlah,
         AVG(h.nilai) AS rata_rata_nilai,
         COUNT(DISTINCT h.user_id) AS peserta_tes
       FROM users u
       LEFT JOIN hasil_ujian h ON h.user_id = u.id
       WHERE u.role = 'calon_siswa'
       GROUP BY u.jurusan`
    );
    const majorMap = new Map(majorRows.map((row) => [row.jurusan, row]));
    const jurusan = MAJORS.map((kode) => {
      const row = majorMap.get(kode);
      return {
        kode,
        nama: { PPLG: "PPLG (RPL)", MPLB: "MPLB (Layanan Bisnis)", PM: "Pemasaran (BDR)" }[kode],
        jumlah: Number(row?.jumlah || 0),
        rataRataNilai: row?.rata_rata_nilai === null || row?.rata_rata_nilai === undefined
          ? null
          : Number(Number(row.rata_rata_nilai).toFixed(2)),
        pesertaTes: Number(row?.peserta_tes || 0),
      };
    });
    const [trendRows] = await pool.execute(
      `SELECT DATE_FORMAT(created_at, '%x-%v') AS pekan, COUNT(*) AS jumlah
       FROM users
       WHERE role = 'calon_siswa' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 WEEK)
       GROUP BY DATE_FORMAT(created_at, '%x-%v')
       ORDER BY pekan`
    );
    const now = new Date();
    const currentWeek = new Date(now);
    currentWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    currentWeek.setHours(0, 0, 0, 0);
    const weekKeys = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(currentWeek);
      date.setDate(currentWeek.getDate() - (7 * (7 - index)));
      const thursday = new Date(date);
      thursday.setDate(date.getDate() + 3);
      const firstThursday = new Date(thursday.getFullYear(), 0, 4);
      firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);
      const week = 1 + Math.round((thursday - firstThursday) / (7 * 24 * 60 * 60 * 1000));
      return {
        key: `${thursday.getFullYear()}-${String(week).padStart(2, "0")}`,
        label: `M${index + 1}`,
      };
    });
    const trendMap = new Map(trendRows.map((row) => [row.pekan, Number(row.jumlah)]));
    const tren = weekKeys.map((week) => ({ pekan: week.label, jumlah: trendMap.get(week.key) || 0 }));
    const current = tren[tren.length - 1]?.jumlah || 0;
    const previous = tren[tren.length - 2]?.jumlah || 0;

    return Response.json({
      ringkasan: {
        totalPendaftar: Number(totals.total || 0),
        biodataLengkap: Number(totals.biodata_lengkap || 0),
        berkasLengkap: Number(documentStats.berkas_lengkap || 0),
        berkasBelumLengkap: Math.max(0, Number(totals.total || 0) - Number(documentStats.berkas_lengkap || 0)),
        sudahMengerjakan: Number(examStats.sudah_mengerjakan || 0),
        belumMengerjakan: Math.max(0, Number(totals.total || 0) - Number(examStats.sudah_mengerjakan || 0)),
        jumlahPengerjaan: Number(examStats.jumlah_pengerjaan || 0),
        rataRataNilai: examStats.rata_rata_nilai === null ? null : Number(Number(examStats.rata_rata_nilai).toFixed(2)),
        diAtasStandar: Number(examStats.di_atas_standar || 0),
        nilaiTerendah: examStats.nilai_terendah === null ? null : Number(examStats.nilai_terendah),
        nilaiTertinggi: examStats.nilai_tertinggi === null ? null : Number(examStats.nilai_tertinggi),
        tesAktif: Boolean(examSetting?.aktif),
        pertumbuhanMingguan: previous ? Number((((current - previous) / previous) * 100).toFixed(1)) : null,
      },
      jurusan,
      tren,
    });
  } catch (error) {
    console.error("Get statistik kepsek error:", error);
    return Response.json({ message: "Gagal memuat statistik penerimaan." }, { status: 500 });
  }
}
