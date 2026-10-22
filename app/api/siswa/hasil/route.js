import { cookies } from "next/headers";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore.get("spmb_session")?.value);
    if (!session || session.role !== "calon_siswa" || !session.sub) {
      return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    }
    const [rows] = await pool.execute(
      `SELECT jumlah_soal, jawaban_benar, nilai, dikumpulkan_pada
       FROM hasil_ujian WHERE user_id = ? ORDER BY dikumpulkan_pada DESC`,
      [Number(session.sub)]
    );
    return Response.json({ hasil: rows });
  } catch (error) {
    console.error("Get hasil ujian siswa error:", error);
    return Response.json({ message: "Gagal memuat hasil ujian." }, { status: 500 });
  }
}
