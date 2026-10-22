import pool from "@/lib/db";
import { requireKepsekApi } from "@/lib/requireKepsekApi";
import { getKepsekApplicantIdsMatchingName, getKepsekApplicantName } from "@/lib/kepsekApplicantDisplay";

export async function GET(request) {
  const auth = await requireKepsekApi();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().slice(0, 100);
    const jurusan = searchParams.get("jurusan") || "";
    const page = Math.max(1, Math.min(100000, Number.parseInt(searchParams.get("page") || "1", 10) || 1));
    const limit = 20;
    const where = ["u.role = 'calon_siswa'"];
    const params = [];
    if (q) {
      const matchingDisplayNameIds = getKepsekApplicantIdsMatchingName(q);
      const displayNameCondition = matchingDisplayNameIds.length
        ? ` OR u.id IN (${matchingDisplayNameIds.map(() => "?").join(", ")})`
        : "";
      where.push(`(u.nama LIKE ? OR u.nisn LIKE ?${displayNameCondition})`);
      params.push(`%${q}%`, `%${q}%`);
      params.push(...matchingDisplayNameIds);
    }
    if (["PPLG", "MPLB", "PM"].includes(jurusan)) {
      where.push("u.jurusan = ?");
      params.push(jurusan);
    }
    const whereSql = where.join(" AND ");
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM hasil_ujian h
       JOIN users u ON u.id = h.user_id WHERE ${whereSql}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT h.id, h.user_id, h.jumlah_soal, h.jawaban_benar, h.nilai,
         h.dikumpulkan_pada, u.nama, u.nisn, u.jurusan
       FROM hasil_ujian h
       JOIN users u ON u.id = h.user_id
       WHERE ${whereSql}
       ORDER BY h.dikumpulkan_pada DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    return Response.json({
      total: Number(total),
      page,
      pageSize: limit,
      pages: Math.max(1, Math.ceil(Number(total) / limit)),
      hasil: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        nama: getKepsekApplicantName(row.user_id, row.nama),
        nisn: row.nisn,
        jurusan: row.jurusan,
        jumlahSoal: row.jumlah_soal,
        benar: row.jawaban_benar,
        nilai: Number(row.nilai),
        dikumpulkanPada: row.dikumpulkan_pada,
      })),
    });
  } catch (error) {
    console.error("Get hasil tes kepsek error:", error);
    return Response.json({ message: "Gagal memuat hasil ujian." }, { status: 500 });
  }
}
