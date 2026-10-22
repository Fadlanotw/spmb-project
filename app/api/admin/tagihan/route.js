import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getMidtransConfig } from "@/lib/midtrans";

async function getAdmin() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);
  return session?.role === "admin" ? session : null;
}

export async function GET() {
  try {
    const session = await getAdmin();
    if (!session) return Response.json({ message: "Akses hanya untuk admin." }, { status: 403 });

    const [[settings]] = await pool.execute(
      `SELECT aktif, nominal, nama_bank, nomor_rekening, nama_pemilik, instruksi
       FROM pengaturan_pembayaran WHERE id = 1`
    );
    const [rows] = await pool.execute(
      `SELECT t.id, t.user_id, t.nominal, t.status, t.bukti_nama_asli,
          t.bukti_ukuran, t.catatan_admin, t.dikirim_pada, t.diverifikasi_pada,
          u.nama, u.email, p.metode AS metode_pembayaran, p.bank AS bank_pembayaran
       FROM tagihan_pembayaran t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN transaksi_pembayaran p ON p.id = (
         SELECT MAX(p2.id) FROM transaksi_pembayaran p2 WHERE p2.tagihan_id = t.id
       )
       ORDER BY FIELD(t.status, 'menunggu_pembayaran', 'menunggu_verifikasi', 'belum_bayar', 'kadaluarsa', 'ditolak', 'lunas'),
         t.dikirim_pada DESC, t.id DESC
       LIMIT 500`
    );
    const [summaryRows] = await pool.execute(
      `SELECT status, COUNT(*) AS jumlah FROM tagihan_pembayaran GROUP BY status`
    );
    const summary = { total: 0, belumBayar: 0, menungguPembayaran: 0, menungguVerifikasi: 0, kadaluarsa: 0, ditolak: 0, lunas: 0 };
    for (const row of summaryRows) {
      const count = Number(row.jumlah);
      summary.total += count;
      if (row.status === "belum_bayar") summary.belumBayar = count;
      if (row.status === "menunggu_pembayaran") summary.menungguPembayaran = count;
      if (row.status === "menunggu_verifikasi") summary.menungguVerifikasi = count;
      if (row.status === "kadaluarsa") summary.kadaluarsa = count;
      if (row.status === "ditolak") summary.ditolak = count;
      if (row.status === "lunas") summary.lunas = count;
    }

    return Response.json({
      gateway: {
        siap: getMidtransConfig().ready,
        lingkungan: getMidtransConfig().production ? "production" : "sandbox",
      },
      pengaturan: {
        aktif: Boolean(settings?.aktif),
        nominal: settings ? Number(settings.nominal) : 0,
        namaBank: settings?.nama_bank || "",
        nomorRekening: settings?.nomor_rekening || "",
        namaPemilik: settings?.nama_pemilik || "",
        instruksi: settings?.instruksi || "",
      },
      ringkasan: summary,
      tagihan: rows.map((row) => ({
        id: Number(row.id),
        userId: Number(row.user_id),
        nama: row.nama,
        email: row.email,
        nominal: Number(row.nominal),
        status: row.status,
        metodePembayaran: row.metode_pembayaran,
        bankPembayaran: row.bank_pembayaran,
        namaBukti: row.bukti_nama_asli,
        ukuranBukti: row.bukti_ukuran,
        catatanAdmin: row.catatan_admin,
        dikirimPada: row.dikirim_pada,
        diverifikasiPada: row.diverifikasi_pada,
        buktiUrl: row.bukti_nama_asli ? `/api/admin/tagihan/${row.id}/bukti` : null,
      })),
      batasTagihan: 500,
    });
  } catch (error) {
    console.error("Get admin tagihan error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi tagihan belum dijalankan. Jalankan database/tagihan.sql." }, { status: 503 });
    }
    return Response.json({ message: "Gagal memuat data tagihan." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getAdmin();
    if (!session) return Response.json({ message: "Akses hanya untuk admin." }, { status: 403 });
    const body = await request.json();
    const { aktif, nominal, namaBank, nomorRekening, namaPemilik, instruksi } = body;
    const bank = typeof namaBank === "string" ? namaBank.trim() : "";
    const account = typeof nomorRekening === "string" ? nomorRekening.trim() : "";
    const holder = typeof namaPemilik === "string" ? namaPemilik.trim() : "";
    const guidance = typeof instruksi === "string" ? instruksi.trim() : "";
    if (typeof aktif !== "boolean" || !Number.isSafeInteger(nominal) || nominal < 0 || nominal > 1_000_000_000_000) {
      return Response.json({ message: "Status dan nominal tagihan tidak valid." }, { status: 400 });
    }
    if (bank.length > 100 || account.length > 50 || holder.length > 150 || guidance.length > 2000) {
      return Response.json({ message: "Data rekening atau instruksi melebihi batas karakter." }, { status: 400 });
    }
    if (aktif && !nominal) {
      return Response.json({ message: "Isi nominal tagihan sebelum mengaktifkan pembayaran." }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `UPDATE pengaturan_pembayaran
         SET aktif = ?, nominal = ?, nama_bank = ?, nomor_rekening = ?, nama_pemilik = ?, instruksi = ?
         WHERE id = 1`,
        [aktif ? 1 : 0, nominal, bank, account, holder, guidance]
      );
      if (aktif) {
        await connection.execute(
          `INSERT IGNORE INTO tagihan_pembayaran
             (user_id, nominal, nama_bank, nomor_rekening, nama_pemilik, instruksi)
           SELECT u.id, p.nominal, p.nama_bank, p.nomor_rekening, p.nama_pemilik, p.instruksi
           FROM users u
           JOIN (SELECT user_id FROM berkas_siswa GROUP BY user_id
                 HAVING COUNT(DISTINCT jenis) >= 6) b ON b.user_id = u.id
           JOIN pengaturan_pembayaran p ON p.id = 1
           WHERE u.role = 'calon_siswa' AND p.aktif = 1 AND p.nominal > 0`
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return Response.json({ message: "Pengaturan pembayaran berhasil disimpan." });
  } catch (error) {
    console.error("Save payment settings error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi tagihan belum dijalankan. Jalankan database/tagihan.sql." }, { status: 503 });
    }
    return Response.json({ message: "Gagal menyimpan pengaturan pembayaran." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getAdmin();
    if (!session) return Response.json({ message: "Akses hanya untuk admin." }, { status: 403 });
    const body = await request.json();
    const id = Number(body.id);
    const action = body.action;
    const note = typeof body.catatan === "string" ? body.catatan.trim() : "";
    if (!Number.isSafeInteger(id) || id < 1 || !["lunas", "ditolak"].includes(action)) {
      return Response.json({ message: "Permintaan verifikasi tidak valid." }, { status: 400 });
    }
    if (action === "ditolak" && !note) {
      return Response.json({ message: "Catatan penolakan wajib diisi agar siswa dapat memperbaiki pembayaran." }, { status: 400 });
    }
    if (note.length > 500) {
      return Response.json({ message: "Catatan maksimal 500 karakter." }, { status: 400 });
    }
    const [result] = await pool.execute(
      `UPDATE tagihan_pembayaran
       SET status = ?, catatan_admin = ?, diverifikasi_pada = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'menunggu_verifikasi' AND bukti_nama_simpan IS NOT NULL`,
      [action, note || null, id]
    );
    if (!result.affectedRows) {
      return Response.json({ message: "Tagihan tidak ditemukan atau sudah diproses." }, { status: 409 });
    }
    return Response.json({ message: action === "lunas" ? "Pembayaran ditandai lunas." : "Bukti pembayaran ditolak." });
  } catch (error) {
    console.error("Verify payment error:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      return Response.json({ message: "Migrasi tagihan belum dijalankan. Jalankan database/tagihan.sql." }, { status: 503 });
    }
    return Response.json({ message: "Gagal memproses verifikasi pembayaran." }, { status: 500 });
  }
}
