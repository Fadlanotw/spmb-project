import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore.get("spmb_session")?.value);
    if (!session || !["admin", "kepsek"].includes(session.role)) {
      return Response.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const [rows] = await pool.execute(
      `SELECT tp.id, tp.nominal, tp.status, tp.bukti_nama_asli, tp.catatan_admin,
              tp.dikirim_pada, tp.diverifikasi_pada, tp.dibuat_pada,
              u.nama AS nama, u.nisn, u.jurusan,
              (SELECT t.metode FROM transaksi_pembayaran t
                WHERE t.tagihan_id = tp.id ORDER BY t.id DESC LIMIT 1) AS metode_online
       FROM tagihan_pembayaran tp
       JOIN users u ON u.id = tp.user_id
       ORDER BY (tp.status = 'menunggu_verifikasi') DESC, tp.dibuat_pada DESC`
    );

    const [[sum]] = await pool.execute(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(status = 'lunas'), 0) AS lunas,
              COALESCE(SUM(status = 'menunggu_verifikasi'), 0) AS verifikasi,
              COALESCE(SUM(status IN ('belum_bayar','menunggu_pembayaran')), 0) AS belum,
              COALESCE(SUM(status IN ('ditolak','kadaluarsa')), 0) AS gagal,
              COALESCE(SUM(CASE WHEN status = 'lunas' THEN nominal END), 0) AS pemasukan
       FROM tagihan_pembayaran`
    );

    return Response.json({
      canApprove: session.role === "admin",
      summary: Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, Number(v)])),
      items: rows.map((r) => ({
        id: Number(r.id),
        nama: r.nama,
        nisn: r.nisn,
        jurusan: r.jurusan,
        nominal: Number(r.nominal),
        status: r.status,
        metode: r.bukti_nama_asli ? "Transfer manual" : r.metode_online === "qris" ? "QRIS" : r.metode_online ? "Virtual Account" : "-",
        adaBukti: Boolean(r.bukti_nama_asli),
        catatan: r.catatan_admin,
        dikirimPada: r.dikirim_pada,
        diverifikasiPada: r.diverifikasi_pada,
      })),
    });
  } catch (error) {
    console.error("List pembayaran error:", error);
    return Response.json({ message: "Gagal memuat data pembayaran." }, { status: 500 });
  }
}