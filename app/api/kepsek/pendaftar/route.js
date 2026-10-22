import pool from "@/lib/db";
import { requireKepsekApi } from "@/lib/requireKepsekApi";
import { getKepsekApplicantIdsMatchingName, getKepsekApplicantName } from "@/lib/kepsekApplicantDisplay";

const VALID_MAJORS = new Set(["PPLG", "MPLB", "PM"]);

export async function GET(request) {
  const auth = await requireKepsekApi();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 100);
    const jurusan = searchParams.get("jurusan") || "";
    const berkas = searchParams.get("berkas") || "";
    const tes = searchParams.get("tes") || "";
    const page = Math.max(1, Math.min(100000, Number.parseInt(searchParams.get("page") || "1", 10) || 1));
    const limit = 20;
    const where = ["u.role = 'calon_siswa'"];
    const params = [];

    if (q) {
      const matchingDisplayNameIds = getKepsekApplicantIdsMatchingName(q);
      const displayNameCondition = matchingDisplayNameIds.length
        ? ` OR u.id IN (${matchingDisplayNameIds.map(() => "?").join(", ")})`
        : "";
      where.push(`(u.nama LIKE ? OR u.nisn LIKE ? OR u.email LIKE ?${displayNameCondition})`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      params.push(...matchingDisplayNameIds);
    }
    if (VALID_MAJORS.has(jurusan)) {
      where.push("u.jurusan = ?");
      params.push(jurusan);
    }
    if (berkas === "lengkap") where.push("COALESCE(d.jumlah_berkas, 0) >= 6");
    if (berkas === "belum") where.push("COALESCE(d.jumlah_berkas, 0) < 6");
    if (tes === "sudah") where.push("h.user_id IS NOT NULL");
    if (tes === "belum") where.push("h.user_id IS NULL");
    const whereSql = where.join(" AND ");
    const dataJoin = `LEFT JOIN (
      SELECT user_id, COUNT(DISTINCT jenis) AS jumlah_berkas
      FROM berkas_siswa GROUP BY user_id
    ) d ON d.user_id = u.id
    LEFT JOIN (
      SELECT user_id, MAX(dikumpulkan_pada) AS terakhir_tes, MAX(nilai) AS nilai
      FROM hasil_ujian GROUP BY user_id
    ) h ON h.user_id = u.id`;

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u ${dataJoin} WHERE ${whereSql}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT u.id, u.nama, u.nisn, u.email, u.whatsapp, u.jurusan, u.created_at,
         b.asal_sekolah, b.nama_orang_tua, COALESCE(d.jumlah_berkas, 0) AS jumlah_berkas,
         h.nilai, h.terakhir_tes
       FROM users u
       LEFT JOIN biodata_siswa b ON b.user_id = u.id
       ${dataJoin}
       WHERE ${whereSql}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    return Response.json({
      total: Number(total),
      page,
      pageSize: limit,
      pages: Math.max(1, Math.ceil(Number(total) / limit)),
      pendaftar: rows.map((row) => ({
        id: row.id,
        nama: getKepsekApplicantName(row.id, row.nama),
        nisn: row.nisn,
        email: row.email,
        whatsapp: row.whatsapp,
        jurusan: row.jurusan,
        asalSekolah: row.asal_sekolah,
        orangTua: row.nama_orang_tua,
        tanggalDaftar: row.created_at,
        berkasLengkap: Number(row.jumlah_berkas) >= 6,
        jumlahBerkas: Number(row.jumlah_berkas),
        nilai: row.nilai === null ? null : Number(row.nilai),
        terakhirTes: row.terakhir_tes,
      })),
    });
  } catch (error) {
    console.error("Get pendaftar kepsek error:", error);
    return Response.json({ message: "Gagal memuat data pendaftar." }, { status: 500 });
  }
}
