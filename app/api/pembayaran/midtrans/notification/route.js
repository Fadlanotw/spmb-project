import { applyMidtransStatus, getMidtransConfig, isValidMidtransSignature } from "@/lib/midtrans";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request) {
  const config = getMidtransConfig();
  if (!config.ready) {
    return Response.json({ message: "Midtrans belum dikonfigurasi." }, { status: 503 });
  }
  try {
    const notification = await request.json();
    if (!isValidMidtransSignature(notification, config.serverKey)) {
      return Response.json({ message: "Signature notifikasi tidak valid." }, { status: 401 });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute(
        `SELECT id, tagihan_id, nominal, status FROM transaksi_pembayaran
         WHERE order_id = ? FOR UPDATE`,
        [notification.order_id]
      );
      const transaction = rows[0];
      if (!transaction) {
        await connection.rollback();
        console.error("Midtrans notification order not found:", notification.order_id);
        return Response.json({ message: "Order pembayaran tidak ditemukan." }, { status: 404 });
      }
      if (Number(notification.gross_amount) !== Number(transaction.nominal)) {
        await connection.rollback();
        console.error("Midtrans notification amount mismatch:", notification.order_id);
        return Response.json({ message: "Nominal notifikasi tidak sesuai tagihan." }, { status: 400 });
      }
      await applyMidtransStatus(connection, transaction, notification.transaction_status);
      await connection.commit();
      return Response.json({ message: "Notifikasi pembayaran berhasil diproses." });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Midtrans payment notification error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi pembayaran online belum dijalankan." }, { status: 503 });
    }
    return Response.json({ message: "Gagal memproses notifikasi pembayaran." }, { status: 500 });
  }
}
