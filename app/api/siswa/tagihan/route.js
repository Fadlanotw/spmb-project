import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getMidtransConfig, paymentFromTransaction } from "@/lib/midtrans";

export const runtime = "nodejs";

const REQUIRED_DOCUMENTS = ["pas_foto", "rapor", "akta", "kk", "surat_sehat", "ijazah"];
const MAX_SIZE = 2 * 1024 * 1024;
const TYPES = {
  "image/jpeg": { extension: ".jpg", signature: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: ".png", signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "application/pdf": { extension: ".pdf", signature: (buffer) => buffer.subarray(0, 5).toString() === "%PDF-" },
};

async function getStudent() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);
  return session?.role === "calon_siswa" && session.sub ? session : null;
}

async function hasCompleteDocuments(userId) {
  const [rows] = await pool.execute(
    "SELECT jenis FROM berkas_siswa WHERE user_id = ?",
    [userId]
  );
  return REQUIRED_DOCUMENTS.every((jenis) => rows.some((row) => row.jenis === jenis));
}

export async function GET() {
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    const userId = Number(session.sub);
    const [[settings]] = await pool.execute(
      `SELECT aktif, nominal, nama_bank, nomor_rekening, nama_pemilik, instruksi
       FROM pengaturan_pembayaran WHERE id = 1`
    );
    const documentsComplete = await hasCompleteDocuments(userId);
    const configured = Boolean(settings?.aktif && Number(settings.nominal) > 0);

    if (documentsComplete && configured) {
      await pool.execute(
        `INSERT IGNORE INTO tagihan_pembayaran
           (user_id, nominal, nama_bank, nomor_rekening, nama_pemilik, instruksi)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, Number(settings.nominal), settings.nama_bank, settings.nomor_rekening, settings.nama_pemilik, settings.instruksi || ""]
      );
    }

    const [[invoice]] = await pool.execute(
      `SELECT id, nominal, nama_bank, nomor_rekening, nama_pemilik, instruksi, status,
         bukti_nama_asli, bukti_ukuran, catatan_admin, dikirim_pada, diverifikasi_pada, dibuat_pada
       FROM tagihan_pembayaran WHERE user_id = ?`,
      [userId]
    );
    const [transactionRows] = invoice
      ? await pool.execute(
        `SELECT id, order_id, metode, bank, status, payment_code, qr_url, redirect_url,
            kadaluarsa_pada, dibuat_pada
         FROM transaksi_pembayaran WHERE tagihan_id = ? ORDER BY id DESC LIMIT 1`,
        [invoice.id]
      )
      : [[]];

    return Response.json({
      eligible: documentsComplete,
      configured,
      gatewayReady: getMidtransConfig().ready,
      gatewayEnvironment: getMidtransConfig().production ? "production" : "sandbox",
      pengaturan: {
        aktif: Boolean(settings?.aktif),
        nominal: settings ? Number(settings.nominal) : 0,
        namaBank: settings?.nama_bank || "",
        nomorRekening: settings?.nomor_rekening || "",
        namaPemilik: settings?.nama_pemilik || "",
        instruksi: settings?.instruksi || "",
      },
      invoice: invoice ? {
        id: Number(invoice.id),
        nominal: Number(invoice.nominal),
        namaBank: invoice.nama_bank,
        nomorRekening: invoice.nomor_rekening,
        namaPemilik: invoice.nama_pemilik,
        instruksi: invoice.instruksi,
        status: invoice.status,
        namaBukti: invoice.bukti_nama_asli,
        ukuranBukti: invoice.bukti_ukuran,
        catatanAdmin: invoice.catatan_admin,
        dikirimPada: invoice.dikirim_pada,
        diverifikasiPada: invoice.diverifikasi_pada,
        dibuatPada: invoice.dibuat_pada,
        transaction: paymentFromTransaction(transactionRows[0]),
      } : null,
    });
  } catch (error) {
    console.error("Get tagihan siswa error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi pembayaran belum dijalankan. Jalankan database/tagihan.sql." }, { status: 503 });
    }
    return Response.json({ message: "Gagal memuat tagihan pembayaran." }, { status: 500 });
  }
}

export async function POST(request) {
  let savedPath;
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    const userId = Number(session.sub);
    if (!(await hasCompleteDocuments(userId))) {
      return Response.json({ message: "Lengkapi enam dokumen persyaratan sebelum mengirim bukti pembayaran." }, { status: 409 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json({ message: "Pilih file bukti pembayaran." }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_SIZE) {
      return Response.json({ message: "Ukuran bukti pembayaran maksimal 2 MB." }, { status: 400 });
    }
    const type = TYPES[file.type];
    const extension = path.extname(file.name).toLowerCase();
    if (!type || (extension !== type.extension && !(type.extension === ".jpg" && extension === ".jpeg"))) {
      return Response.json({ message: "Format bukti pembayaran harus JPG, PNG, atau PDF." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!type.signature(buffer)) {
      return Response.json({ message: "Isi file tidak sesuai dengan format bukti pembayaran." }, { status: 400 });
    }

    const storedName = `${randomUUID()}${type.extension}`;
    const storageDirectory = path.join(process.cwd(), "storage", "pembayaran");
    await mkdir(storageDirectory, { recursive: true });
    savedPath = path.join(storageDirectory, storedName);
    await writeFile(savedPath, buffer, { flag: "wx" });

    const connection = await pool.getConnection();
    let oldStoredName;
    try {
      await connection.beginTransaction();
      const [[settings]] = await connection.execute(
        "SELECT aktif FROM pengaturan_pembayaran WHERE id = 1 FOR UPDATE"
      );
      if (!settings?.aktif) {
        await connection.rollback();
        await unlink(savedPath);
        savedPath = undefined;
        return Response.json({ message: "Pengiriman pembayaran sedang ditutup oleh panitia." }, { status: 409 });
      }
      const [invoices] = await connection.execute(
        "SELECT status, bukti_nama_simpan FROM tagihan_pembayaran WHERE user_id = ? FOR UPDATE",
        [userId]
      );
      const invoice = invoices[0];
      if (!invoice) {
        await connection.rollback();
        await unlink(savedPath);
        savedPath = undefined;
        return Response.json({ message: "Tagihan belum tersedia. Lengkapi berkas dan hubungi panitia." }, { status: 409 });
      }
      if (!["belum_bayar", "ditolak"].includes(invoice.status)) {
        await connection.rollback();
        await unlink(savedPath);
        savedPath = undefined;
        return Response.json({ message: "Bukti hanya dapat dikirim untuk tagihan yang belum dibayar atau ditolak." }, { status: 409 });
      }
      oldStoredName = invoice.bukti_nama_simpan;
      await connection.execute(
        `UPDATE tagihan_pembayaran
         SET status = 'menunggu_verifikasi', bukti_nama_asli = ?, bukti_nama_simpan = ?,
             bukti_mime = ?, bukti_ukuran = ?, catatan_admin = NULL, dikirim_pada = CURRENT_TIMESTAMP,
             diverifikasi_pada = NULL
         WHERE user_id = ?`,
        [path.basename(file.name).slice(0, 255), storedName, file.type, buffer.length, userId]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (oldStoredName) {
      await unlink(path.join(storageDirectory, oldStoredName)).catch((error) => {
        if (error.code !== "ENOENT") console.error("Remove replaced payment proof error:", error);
      });
    }
    return Response.json({ message: "Bukti pembayaran berhasil dikirim untuk diverifikasi." }, { status: 201 });
  } catch (error) {
    if (savedPath) {
      await unlink(savedPath).catch((cleanupError) => {
        if (cleanupError.code !== "ENOENT") console.error("Cleanup payment proof error:", cleanupError);
      });
    }
    console.error("Submit payment proof error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi tagihan belum dijalankan. Jalankan database/tagihan.sql." }, { status: 503 });
    }
    return Response.json({ message: "Gagal mengirim bukti pembayaran." }, { status: 500 });
  }
}
