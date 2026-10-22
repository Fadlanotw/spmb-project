import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import {
  applyMidtransStatus,
  getMidtransConfig,
  midtransRequest,
  paymentFromTransaction,
} from "@/lib/midtrans";

export const runtime = "nodejs";

const BANKS = new Set(["bca", "bni", "bri", "permata", "cimb"]);

async function getStudent() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);
  return session?.role === "calon_siswa" && session.sub ? session : null;
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function getLatestTransaction(userId) {
  const [rows] = await pool.execute(
    `SELECT t.id, t.tagihan_id, t.user_id, t.order_id, t.metode, t.bank, t.nominal,
       t.status, t.payment_code, t.qr_url, t.redirect_url, t.kadaluarsa_pada, t.dibuat_pada
     FROM transaksi_pembayaran t
     JOIN tagihan_pembayaran i ON i.id = t.tagihan_id
     WHERE i.user_id = ? ORDER BY t.id DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

function getChargeDetails(response, method, bank) {
  const actions = Array.isArray(response.actions) ? response.actions : [];
  const qrAction = actions.find((action) => action.name === "generate-qr-code");
  const redirectAction = actions.find((action) => action.name === "deeplink-redirect");
  const va = Array.isArray(response.va_numbers) ? response.va_numbers[0] : null;
  const paymentCode = va?.va_number || response.permata_va_number || response.bill_key || null;
  if (method === "qris" && !qrAction?.url) {
    throw new Error("Midtrans tidak mengembalikan QR pembayaran.");
  }
  if (method === "virtual_account" && !paymentCode) {
    throw new Error("Midtrans tidak mengembalikan nomor Virtual Account.");
  }
  return {
    bank: va?.bank || (method === "virtual_account" ? bank : null),
    paymentCode,
    qrUrl: qrAction?.url || null,
    redirectUrl: redirectAction?.url || response.redirect_url || null,
    expiresAt: response.expiry_time || null,
  };
}

async function saveGatewayResponse(transactionId, response, details) {
  await pool.execute(
    `UPDATE transaksi_pembayaran
     SET bank = ?, payment_code = ?, qr_url = ?, redirect_url = ?, kadaluarsa_pada = ?,
         status = 'pending', gateway_response = ?
     WHERE id = ?`,
    [
      details.bank,
      details.paymentCode,
      details.qrUrl,
      details.redirectUrl,
      details.expiresAt,
      JSON.stringify(response),
      transactionId,
    ]
  );
}

async function syncPaymentStatus(transaction) {
  const response = await midtransRequest(`/v2/${encodeURIComponent(transaction.order_id)}/status`);
  if (response.order_id !== transaction.order_id || Number(response.gross_amount) !== Number(transaction.nominal)) {
    throw new Error("Data pembayaran Midtrans tidak cocok dengan tagihan.");
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT id, tagihan_id, nominal FROM transaksi_pembayaran
       WHERE order_id = ? AND user_id = ? FOR UPDATE`,
      [transaction.order_id, transaction.user_id]
    );
    if (rows[0]) await applyMidtransStatus(connection, rows[0], response.transaction_status);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return response;
}

export async function GET() {
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    const userId = Number(session.sub);
    const transaction = await getLatestTransaction(userId);
    if (!transaction) return Response.json({ transaction: null });

    let gatewayStatus = null;
    if (transaction.status === "pending" && getMidtransConfig().ready) {
      try {
        const response = await syncPaymentStatus(transaction);
        gatewayStatus = response.transaction_status;
      } catch (error) {
        console.error("Synchronize student Midtrans status error:", error);
        return Response.json({ message: "Status pembayaran belum dapat diperbarui dari Midtrans." }, { status: 502 });
      }
    }

    const refreshed = await getLatestTransaction(userId);
    return Response.json({ transaction: paymentFromTransaction(refreshed), gatewayStatus });
  } catch (error) {
    console.error("Get student payment status error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi pembayaran online belum dijalankan." }, { status: 503 });
    }
    return Response.json({ message: "Gagal memuat status pembayaran." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getStudent();
  if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
  if (!sameOrigin(request)) return Response.json({ message: "Permintaan pembayaran tidak valid." }, { status: 403 });
  const config = getMidtransConfig();
  if (!config.ready) {
    return Response.json({ message: "Pembayaran online belum aktif. Admin perlu mengatur MIDTRANS_SERVER_KEY terlebih dahulu." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Data metode pembayaran tidak valid." }, { status: 400 });
  }
  const method = body.method;
  const bank = body.bank;
  if (method !== "qris" && method !== "virtual_account") {
    return Response.json({ message: "Pilih metode QRIS atau Virtual Account." }, { status: 400 });
  }
  if (method === "virtual_account" && !BANKS.has(bank)) {
    return Response.json({ message: "Pilih bank Virtual Account yang tersedia." }, { status: 400 });
  }

  const userId = Number(session.sub);
  let transaction;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[settings]] = await connection.execute(
      "SELECT aktif FROM pengaturan_pembayaran WHERE id = 1 FOR UPDATE"
    );
    if (!settings?.aktif) {
      await connection.rollback();
      return Response.json({ message: "Pembayaran belum dibuka oleh panitia." }, { status: 409 });
    }
    const [invoices] = await connection.execute(
      `SELECT id, nominal, status FROM tagihan_pembayaran
       WHERE user_id = ? FOR UPDATE`,
      [userId]
    );
    const invoice = invoices[0];
    if (!invoice) {
      await connection.rollback();
      return Response.json({ message: "Tagihan belum tersedia. Lengkapi dokumen pendaftaran terlebih dahulu." }, { status: 409 });
    }
    if (invoice.status === "lunas") {
      await connection.rollback();
      return Response.json({ message: "Tagihan ini sudah lunas." }, { status: 409 });
    }

    const [previousRows] = await connection.execute(
      `SELECT id, tagihan_id, user_id, order_id, metode, bank, nominal, status,
         payment_code, qr_url, redirect_url, kadaluarsa_pada, dibuat_pada
       FROM transaksi_pembayaran
       WHERE tagihan_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [invoice.id]
    );
    const previous = previousRows[0];
    if (previous?.status === "pending") {
      await connection.commit();
      try {
        const remote = await syncPaymentStatus(previous);
        const latest = await getLatestTransaction(userId);
        if (remote.transaction_status === "pending") {
          return Response.json({ transaction: paymentFromTransaction(latest), reused: true });
        }
        if (["settlement", "capture"].includes(remote.transaction_status)) {
          return Response.json({ message: "Pembayaran sudah berhasil dikonfirmasi.", transaction: paymentFromTransaction(latest) }, { status: 409 });
        }
      } catch (error) {
        console.error("Check existing Midtrans payment error:", error);
        return Response.json({ message: "Pembayaran sebelumnya belum dapat dipastikan. Periksa kembali status pembayaran sebelum membuat transaksi baru." }, { status: 502 });
      }
      return Response.json({ message: "Pembayaran sebelumnya telah berakhir. Muat ulang halaman untuk membuat transaksi baru." }, { status: 409 });
    }

    const [users] = await connection.execute(
      "SELECT nama, email, whatsapp FROM users WHERE id = ? AND role = 'calon_siswa'",
      [userId]
    );
    const user = users[0];
    if (!user || Number(invoice.nominal) < 1) {
      await connection.rollback();
      return Response.json({ message: "Data tagihan atau calon siswa tidak valid." }, { status: 409 });
    }
    const orderId = `SPMB-${invoice.id}-${randomUUID().slice(0, 12)}`;
    const [insertResult] = await connection.execute(
      `INSERT INTO transaksi_pembayaran
         (tagihan_id, user_id, order_id, metode, bank, nominal, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [invoice.id, userId, orderId, method, method === "virtual_account" ? bank : null, Number(invoice.nominal)]
    );
    transaction = {
      id: Number(insertResult.insertId),
      tagihan_id: Number(invoice.id),
      user_id: userId,
      order_id: orderId,
      metode: method,
      bank: method === "virtual_account" ? bank : null,
      nominal: Number(invoice.nominal),
      status: "pending",
      payment_code: null,
      qr_url: null,
      redirect_url: null,
      kadaluarsa_pada: null,
      dibuat_pada: new Date(),
    };
    await connection.execute(
      "UPDATE tagihan_pembayaran SET status = 'menunggu_pembayaran' WHERE id = ? AND status <> 'lunas'",
      [invoice.id]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Prepare Midtrans payment error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi pembayaran online belum dijalankan. Jalankan database/tagihan.sql." }, { status: 503 });
    }
    return Response.json({ message: "Gagal menyiapkan pembayaran." }, { status: 500 });
  } finally {
    connection.release();
  }

  try {
    const [users] = await pool.execute(
      "SELECT nama, email, whatsapp FROM users WHERE id = ?",
      [userId]
    );
    const customer = users[0];
    const payload = {
      payment_type: method === "qris" ? "qris" : "bank_transfer",
      transaction_details: {
        order_id: transaction.order_id,
        gross_amount: transaction.nominal,
      },
      item_details: [{
        id: `SPMB-${transaction.tagihan_id}`,
        price: transaction.nominal,
        quantity: 1,
        name: "Pendaftaran siswa baru Garuda Utama",
      }],
      customer_details: {
        first_name: customer?.nama || "Calon Siswa",
        email: customer?.email || undefined,
        phone: customer?.whatsapp || undefined,
      },
      ...(method === "qris" ? { qris: { acquirer: "gopay" } } : { bank_transfer: { bank } }),
    };
    const response = await midtransRequest("/v2/charge", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (response.order_id !== transaction.order_id || Number(response.gross_amount) !== transaction.nominal) {
      throw new Error("Data transaksi dari Midtrans tidak sesuai dengan tagihan.");
    }
    const details = getChargeDetails(response, method, bank);
    await saveGatewayResponse(transaction.id, response, details);
    return Response.json({
      transaction: paymentFromTransaction({ ...transaction, ...details, status: "pending" }),
    }, { status: 201 });
  } catch (error) {
    console.error("Create Midtrans payment error:", error);
    try {
      const response = await midtransRequest(`/v2/${encodeURIComponent(transaction.order_id)}/status`);
      if (response.order_id === transaction.order_id && Number(response.gross_amount) === transaction.nominal) {
        const details = getChargeDetails(response, method, bank);
        await saveGatewayResponse(transaction.id, response, details);
        return Response.json({
          transaction: paymentFromTransaction({ ...transaction, ...details, status: response.transaction_status }),
        }, { status: 201 });
      }
    } catch (reconcileError) {
      console.error("Reconcile Midtrans payment creation error:", reconcileError);
    }
    return Response.json({
      message: "Transaksi belum dapat dipastikan dari Midtrans. Muat ulang status sebelum mencoba lagi.",
      orderId: transaction.order_id,
    }, { status: 502 });
  }
}
