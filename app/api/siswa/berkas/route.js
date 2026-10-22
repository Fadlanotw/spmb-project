import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_SIZE = 2 * 1024 * 1024;
const DOCUMENTS = new Set(["pas_foto", "rapor", "akta", "kk", "surat_sehat", "ijazah"]);
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

function safeDocument(row) {
  return { id: row.id, jenis: row.jenis, nama: row.nama_asli, ukuran: row.ukuran, uploadedAt: row.uploaded_at, url: `/api/siswa/berkas/${row.id}` };
}

export async function GET() {
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    const [rows] = await pool.execute(
      "SELECT id, jenis, nama_asli, ukuran, uploaded_at FROM berkas_siswa WHERE user_id = ? ORDER BY id",
      [Number(session.sub)]
    );
    return Response.json({ berkas: rows.map(safeDocument) });
  } catch (error) {
    console.error("Get berkas siswa error:", error);
    return Response.json({ message: "Gagal memuat berkas siswa." }, { status: 500 });
  }
}

export async function POST(request) {
  let savedPath;
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    const formData = await request.formData();
    const jenis = formData.get("jenis");
    const file = formData.get("file");
    if (typeof jenis !== "string" || !DOCUMENTS.has(jenis) || !file || typeof file.arrayBuffer !== "function") {
      return Response.json({ message: "Jenis berkas atau file tidak valid." }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_SIZE) {
      return Response.json({ message: "Ukuran berkas harus lebih kecil dari atau sama dengan 2 MB." }, { status: 400 });
    }
    const type = TYPES[file.type];
    if (!type || path.extname(file.name).toLowerCase() !== type.extension && !(type.extension === ".jpg" && path.extname(file.name).toLowerCase() === ".jpeg")) {
      return Response.json({ message: "Format berkas harus JPG, PNG, atau PDF." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!type.signature(buffer)) {
      return Response.json({ message: "Isi file tidak sesuai dengan format berkas." }, { status: 400 });
    }

    const storedName = `${randomUUID()}${type.extension}`;
    const storageDirectory = path.join(process.cwd(), "storage", "pendaftaran");
    await mkdir(storageDirectory, { recursive: true });
    savedPath = path.join(storageDirectory, storedName);
    await writeFile(savedPath, buffer, { flag: "wx" });

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute(
        "SELECT nama_simpan FROM berkas_siswa WHERE user_id = ? AND jenis = ? FOR UPDATE",
        [Number(session.sub), jenis]
      );
      await connection.execute(
        `INSERT INTO berkas_siswa (user_id, jenis, nama_asli, nama_simpan, mime_type, ukuran)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nama_asli = VALUES(nama_asli), nama_simpan = VALUES(nama_simpan),
           mime_type = VALUES(mime_type), ukuran = VALUES(ukuran), uploaded_at = CURRENT_TIMESTAMP`,
        [Number(session.sub), jenis, path.basename(file.name).slice(0, 255), storedName, file.type, buffer.length]
      );
      await connection.commit();
      if (existing[0]) await unlink(path.join(storageDirectory, existing[0].nama_simpan)).catch((error) => {
        if (error.code !== "ENOENT") console.error("Replace old student file error:", error);
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return Response.json({ message: "Berkas berhasil diunggah." }, { status: 201 });
  } catch (error) {
    if (savedPath) await unlink(savedPath).catch((cleanupError) => {
      if (cleanupError.code !== "ENOENT") console.error("Cleanup failed student upload error:", cleanupError);
    });
    console.error("Upload berkas siswa error:", error);
    return Response.json({ message: "Gagal mengunggah berkas." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
      return Response.json({ message: "Berkas tidak valid." }, { status: 400 });
    }
    const [rows] = await pool.execute(
      "SELECT nama_simpan FROM berkas_siswa WHERE id = ? AND user_id = ?",
      [id, Number(session.sub)]
    );
    if (!rows[0]) return Response.json({ message: "Berkas tidak ditemukan." }, { status: 404 });
    await pool.execute("DELETE FROM berkas_siswa WHERE id = ? AND user_id = ?", [id, Number(session.sub)]);
    try {
      await unlink(path.join(process.cwd(), "storage", "pendaftaran", rows[0].nama_simpan));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return Response.json({ message: "Berkas berhasil dihapus." });
  } catch (error) {
    console.error("Delete berkas siswa error:", error);
    return Response.json({ message: "Gagal menghapus berkas." }, { status: 500 });
  }
}
