import pool from "@/lib/db";
import { requireKepsekApi } from "@/lib/requireKepsekApi";
import { getKepsekApplicantName } from "@/lib/kepsekApplicantDisplay";

export async function GET() {
  const auth = await requireKepsekApi();
  if (auth.response) return auth.response;

  try {
    const [[summary]] = await pool.execute(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN b.user_id IS NOT NULL THEN 1 ELSE 0 END) AS biodata_lengkap,
         SUM(CASE WHEN COALESCE(d.jumlah_berkas, 0) >= 6 THEN 1 ELSE 0 END) AS berkas_lengkap,
         COUNT(DISTINCT h.user_id) AS sudah_tes
       FROM users u
       LEFT JOIN biodata_siswa b ON b.user_id = u.id
       LEFT JOIN (
         SELECT user_id, COUNT(DISTINCT jenis) AS jumlah_berkas
         FROM berkas_siswa GROUP BY user_id
       ) d ON d.user_id = u.id
       LEFT JOIN hasil_ujian h ON h.user_id = u.id
       WHERE u.role = 'calon_siswa'`
    );
    const [rows] = await pool.execute(
      `SELECT u.id, u.nama, u.nisn, u.jurusan, u.created_at,
         b.updated_at AS biodata_updated,
         COALESCE(d.jumlah_berkas, 0) AS jumlah_berkas,
         d.berkas_terakhir,
         h.terakhir_tes,
         h.nilai
       FROM users u
       LEFT JOIN biodata_siswa b ON b.user_id = u.id
       LEFT JOIN (
         SELECT user_id, COUNT(DISTINCT jenis) AS jumlah_berkas, MAX(uploaded_at) AS berkas_terakhir
         FROM berkas_siswa GROUP BY user_id
       ) d ON d.user_id = u.id
       LEFT JOIN (
         SELECT user_id, MAX(dikumpulkan_pada) AS terakhir_tes, MAX(nilai) AS nilai
         FROM hasil_ujian GROUP BY user_id
       ) h ON h.user_id = u.id
       WHERE u.role = 'calon_siswa'
       ORDER BY GREATEST(
         COALESCE(h.terakhir_tes, '1000-01-01'),
         COALESCE(d.berkas_terakhir, '1000-01-01'),
         COALESCE(b.updated_at, '1000-01-01'),
         u.created_at
       ) DESC
       LIMIT 50`
    );
    const [[setting]] = await pool.execute("SELECT aktif FROM pengaturan_ujian WHERE id = 1");
    return Response.json({
      tesAktif: Boolean(setting?.aktif),
      ringkasan: {
        total: Number(summary.total || 0),
        biodataLengkap: Number(summary.biodata_lengkap || 0),
        berkasLengkap: Number(summary.berkas_lengkap || 0),
        sudahTes: Number(summary.sudah_tes || 0),
      },
      monitoring: rows.map((row) => ({
        id: row.id,
        nama: getKepsekApplicantName(row.id, row.nama),
        nisn: row.nisn,
        jurusan: row.jurusan,
        terdaftar: row.created_at,
        biodataSelesai: Boolean(row.biodata_updated),
        jumlahBerkas: Number(row.jumlah_berkas),
        terakhirAktivitas: [row.terakhir_tes, row.berkas_terakhir, row.biodata_updated, row.created_at]
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a))[0],
        sudahTes: Boolean(row.terakhir_tes),
        nilai: row.nilai === null ? null : Number(row.nilai),
      })),
    });
  } catch (error) {
    console.error("Get monitoring kepsek error:", error);
    return Response.json({ message: "Gagal memuat monitoring pendaftar." }, { status: 500 });
  }
}
