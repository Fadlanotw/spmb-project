import { createHash, timingSafeEqual } from "node:crypto";

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  return {
    serverKey,
    production: process.env.MIDTRANS_IS_PRODUCTION === "true",
    ready: Boolean(serverKey),
  };
}

function getBaseUrl(production) {
  return production
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

export async function midtransRequest(path, options = {}) {
  const config = getMidtransConfig();
  if (!config.ready) throw new Error("MIDTRANS_SERVER_KEY belum diatur.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${getBaseUrl(config.production)}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) {
      const message = Array.isArray(result?.messages) ? result.messages.join(" ") : result?.status_message;
      throw new Error(message || `Midtrans menolak permintaan (HTTP ${response.status}).`);
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export async function midtransQrCode(orderId) {
  const config = getMidtransConfig();
  if (!config.ready) throw new Error("MIDTRANS_SERVER_KEY belum diatur.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${getBaseUrl(config.production)}/v2/${encodeURIComponent(orderId)}/qr-code`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
        Accept: "image/png",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Midtrans gagal menyediakan QR pembayaran (HTTP ${response.status}).`);
    if (response.headers.get("content-type")?.split(";")[0] !== "image/png") {
      throw new Error("Midtrans mengembalikan format QR pembayaran yang tidak valid.");
    }
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 1024 * 1024) throw new Error("Ukuran QR pembayaran dari Midtrans melebihi batas.");
    const image = await response.arrayBuffer();
    if (image.byteLength > 1024 * 1024) throw new Error("Ukuran QR pembayaran dari Midtrans melebihi batas.");
    return image;
  } finally {
    clearTimeout(timeout);
  }
}

export function getPaymentStatus(status) {
  switch (status) {
    case "settlement":
    case "capture":
      return { transaction: status, invoice: "lunas" };
    case "expire":
      return { transaction: "expire", invoice: "kadaluarsa" };
    case "cancel":
    case "deny":
    case "failure":
      return { transaction: status, invoice: "belum_bayar" };
    case "pending":
      return { transaction: "pending", invoice: "menunggu_pembayaran" };
    case "refund":
    case "partial_refund":
      return { transaction: "refund", invoice: null };
    default:
      return { transaction: "unknown", invoice: null };
  }
}

export function isValidMidtransSignature(notification, serverKey) {
  if (
    typeof notification.order_id !== "string" ||
    typeof notification.status_code !== "string" ||
    typeof notification.gross_amount !== "string" ||
    typeof notification.signature_key !== "string"
  ) {
    return false;
  }
  const expected = createHash("sha512")
    .update(`${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`)
    .digest();
  let provided;
  try {
    provided = Buffer.from(notification.signature_key, "hex");
  } catch {
    return false;
  }
  return provided.length === expected.length && timingSafeEqual(expected, provided);
}

export async function applyMidtransStatus(connection, transaction, gatewayStatus) {
  const mapped = getPaymentStatus(gatewayStatus);
  await connection.execute(
    "UPDATE transaksi_pembayaran SET status = ?, gateway_response = ? WHERE id = ?",
    [mapped.transaction, JSON.stringify({ transaction_status: gatewayStatus }), transaction.id]
  );

  if (mapped.invoice === "lunas") {
    await connection.execute(
      `UPDATE tagihan_pembayaran SET status = 'lunas', catatan_admin = NULL,
         diverifikasi_pada = CURRENT_TIMESTAMP
       WHERE id = ? AND status <> 'lunas'`,
      [transaction.tagihan_id]
    );
  } else if (mapped.invoice) {
    const [[latest]] = await connection.execute(
      "SELECT id FROM transaksi_pembayaran WHERE tagihan_id = ? ORDER BY id DESC LIMIT 1",
      [transaction.tagihan_id]
    );
    if (Number(latest?.id) === Number(transaction.id)) {
      await connection.execute(
        `UPDATE tagihan_pembayaran SET status = ?, diverifikasi_pada = NULL
         WHERE id = ? AND status <> 'lunas'`,
        [mapped.invoice, transaction.tagihan_id]
      );
    }
  }
  return mapped;
}

export async function synchronizeMidtransStatus(transaction, connection) {
  const response = await midtransRequest(`/v2/${encodeURIComponent(transaction.order_id)}/status`);
  if (response.order_id !== transaction.order_id || Number(response.gross_amount) !== Number(transaction.nominal)) {
    throw new Error("Data pembayaran Midtrans tidak cocok dengan tagihan.");
  }
  await connection.beginTransaction();
  try {
    const [rows] = await connection.execute(
      "SELECT id, tagihan_id, nominal FROM transaksi_pembayaran WHERE order_id = ? FOR UPDATE",
      [transaction.order_id]
    );
    if (!rows[0]) {
      await connection.rollback();
      return response;
    }
    await applyMidtransStatus(connection, rows[0], response.transaction_status);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
  return response;
}

export function paymentFromTransaction(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    orderId: row.order_id,
    method: row.metode,
    bank: row.bank,
    status: row.status,
    paymentCode: row.payment_code,
    qrUrl: row.metode === "qris"
      ? `/api/siswa/tagihan/payment/qr?orderId=${encodeURIComponent(row.order_id)}`
      : null,
    redirectUrl: row.redirect_url,
    expiresAt: row.kadaluarsa_pada,
    createdAt: row.dibuat_pada,
  };
}
