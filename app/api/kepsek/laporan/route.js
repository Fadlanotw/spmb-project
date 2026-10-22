import pool from "@/lib/db";
import { requireKepsekApi } from "@/lib/requireKepsekApi";
import { getKepsekApplicantName } from "@/lib/kepsekApplicantDisplay";

function escapeCsv(value) {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const auth = await requireKepsekApi();
  if (auth.response) return auth.response;

  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nama, u.nisn, u.email, u.whatsapp, u.jurusan, u.created_at,
         b.asal_sekolah, COALESCE(d.jumlah_berkas, 0) AS jumlah_berkas,
         h.nilai, h.terakhir_tes
       FROM users u
       LEFT JOIN biodata_siswa b ON b.user_id = u.id
       LEFT JOIN (
         SELECT user_id, COUNT(DISTINCT jenis) AS jumlah_berkas
         FROM berkas_siswa GROUP BY user_id
       ) d ON d.user_id = u.id
       LEFT JOIN (
         SELECT user_id, MAX(nilai) AS nilai, MAX(dikumpulkan_pada) AS terakhir_tes
         FROM hasil_ujian GROUP BY user_id
       ) h ON h.user_id = u.id
       WHERE u.role = 'calon_siswa'
       ORDER BY u.created_at DESC, u.id DESC`
    );
    const header = ["Nama", "NISN", "Email", "WhatsApp", "Jurusan", "Sekolah Asal", "Tanggal Daftar", "Berkas (dari 6)", "Status Tes", "Nilai", "Tanggal Tes"];
    const body = rows.map((row) => [
      getKepsekApplicantName(row.id, row.nama),
      row.nisn,
      row.email,
      row.whatsapp,
      row.jurusan,
      row.asal_sekolah,
      row.created_at ? new Date(row.created_at).toISOString() : "",
      `${Number(row.jumlah_berkas)}/6`,
      row.terakhir_tes ? "Selesai" : "Belum",
      row.nilai === null ? "" : Number(row.nilai).toFixed(2),
      row.terakhir_tes || "",
    ]);
    const csv = ["sep=;", [header, ...body].map((line) => line.map(escapeCsv).join(";")).join("\r\n")].join("\r\n");
    return new Response(`\ufeff${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="laporan-spmb-kepsek.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Export laporan kepsek error:", error);
    return Response.json({ message: "Gagal mengunduh laporan SPMB." }, { status: 500 });
  }
}
