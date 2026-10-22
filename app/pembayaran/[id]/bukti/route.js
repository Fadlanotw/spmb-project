import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);
  if (!session || !["admin", "kepsek"].includes(session.role)) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }
  const { id } = await params;
  const [[row]] = await pool.execute(
    "SELECT bukti_nama_simpan, bukti_mime FROM tagihan_pembayaran WHERE id = ?",
    [Number(id)]
  );
  if (!row?.bukti_nama_simpan) return Response.json({ message: "Bukti tidak ada." }, { status: 404 });

  try {
    const file = await readFile(path.join(process.cwd(), "storage", "pembayaran", path.basename(row.bukti_nama_simpan)));
    return new Response(file, {
      headers: { "Content-Type": row.bukti_mime, "Content-Disposition": "inline", "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ message: "File bukti tidak ditemukan." }, { status: 404 });
  }
}