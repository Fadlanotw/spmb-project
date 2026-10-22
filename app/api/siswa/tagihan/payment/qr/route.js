import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { midtransQrCode } from "@/lib/midtrans";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore.get("spmb_session")?.value);
    if (session?.role !== "calon_siswa" || !session.sub) {
      return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    }

    const orderId = new URL(request.url).searchParams.get("orderId");
    if (!orderId || orderId.length > 50) {
      return Response.json({ message: "Order pembayaran tidak valid." }, { status: 400 });
    }
    const [rows] = await pool.execute(
      `SELECT order_id FROM transaksi_pembayaran
       WHERE order_id = ? AND user_id = ? AND metode = 'qris' AND status = 'pending'`,
      [orderId, Number(session.sub)]
    );
    if (!rows[0]) return Response.json({ message: "QR pembayaran tidak ditemukan atau sudah tidak aktif." }, { status: 404 });

    const image = await midtransQrCode(orderId);
    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Get Midtrans QR code error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi pembayaran online belum dijalankan." }, { status: 503 });
    }
    return Response.json({ message: "QR pembayaran belum dapat dimuat dari Midtrans." }, { status: 502 });
  }
}
