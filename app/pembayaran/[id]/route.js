import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore.get("spmb_session")?.value);
    if (session?.role !== "admin") {
      return Response.json({ message: "Hanya admin yang dapat memverifikasi pembayaran." }, { status: 403 });
    }

    const { id } = await params;
    const { aksi, catatan } = await request.json();
    if (!["acc", "tolak"].includes(aksi)) {
      return Response.json({ message: "Aksi tidak valid." }, { status: 400 });
    }
    if (aksi === "tolak" && !String(catatan || "").trim()) {
      return Response.json({ message: "Alasan penolakan wajib diisi." }, { status: 400 });
    }

    const [result] = await pool.execute(
      `UPDATE tagihan_pembayaran
       SET status = ?, catatan_admin = ?, diverifikasi_pada = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'menunggu_verifikasi'`,
      [aksi === "acc" ? "lunas" : "ditolak", aksi === "tolak" ? String(catatan).trim().slice(0, 255) : null, Number(id)]
    );
    if (result.affectedRows === 0) {
      return Response.json({ message: "Tagihan tidak ditemukan atau sudah diproses." }, { status: 409 });
    }
    return Response.json({ message: aksi === "acc" ? "Pembayaran diverifikasi (lunas)." : "Pembayaran ditolak." });
  } catch (error) {
    console.error("Verify pembayaran error:", error);
    return Response.json({ message: "Gagal memproses verifikasi." }, { status: 500 });
  }
}