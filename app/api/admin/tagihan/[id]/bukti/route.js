import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore.get("spmb_session")?.value);
    if (session?.role !== "admin") {
      return Response.json({ message: "Akses hanya untuk admin." }, { status: 403 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id < 1) {
      return Response.json({ message: "Tagihan tidak valid." }, { status: 400 });
    }
    const [rows] = await pool.execute(
      `SELECT bukti_nama_asli, bukti_nama_simpan, bukti_mime
       FROM tagihan_pembayaran WHERE id = ? AND bukti_nama_simpan IS NOT NULL`,
      [id]
    );
    const proof = rows[0];
    if (!proof) return Response.json({ message: "Bukti pembayaran tidak ditemukan." }, { status: 404 });
    const safeName = path.basename(proof.bukti_nama_simpan);
    if (safeName !== proof.bukti_nama_simpan) {
      return Response.json({ message: "Bukti pembayaran tidak valid." }, { status: 500 });
    }
    const content = await readFile(path.join(process.cwd(), "storage", "pembayaran", safeName));
    return new Response(content, {
      headers: {
        "Content-Type": proof.bukti_mime,
        "Content-Disposition": `inline; filename="${encodeURIComponent(proof.bukti_nama_asli)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return Response.json({ message: "File bukti pembayaran tidak ditemukan." }, { status: 404 });
    }
    console.error("Get admin payment proof error:", error);
    return Response.json({ message: "Gagal membuka bukti pembayaran." }, { status: 500 });
  }
}
