import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore.get("spmb_session")?.value);
    if (!session || session.role !== "calon_siswa" || !session.sub) {
      return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id < 1) return Response.json({ message: "Berkas tidak valid." }, { status: 400 });
    const [rows] = await pool.execute(
      "SELECT nama_asli, nama_simpan, mime_type FROM berkas_siswa WHERE id = ? AND user_id = ?",
      [id, Number(session.sub)]
    );
    if (!rows[0]) return Response.json({ message: "Berkas tidak ditemukan." }, { status: 404 });

    const buffer = await readFile(path.join(process.cwd(), "storage", "pendaftaran", rows[0].nama_simpan));
    return new Response(buffer, {
      headers: {
        "Content-Type": rows[0].mime_type,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(rows[0].nama_asli)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Read student file error:", error);
    return Response.json({ message: "Gagal membuka berkas." }, { status: 500 });
  }
}
