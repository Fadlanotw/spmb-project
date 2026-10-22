import { cookies } from "next/headers";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

async function getStudent() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);
  if (!session || session.role !== "calon_siswa" || !session.sub) return null;
  return session;
}

export async function GET() {
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });

    const [rows] = await pool.execute(
      `SELECT u.id, u.nama, u.email, u.nisn, u.whatsapp, u.jurusan,
              b.tempat_lahir, b.tanggal_lahir, b.jenis_kelamin, b.alamat,
              b.asal_sekolah, b.nama_orang_tua, b.whatsapp_orang_tua
       FROM users u
       LEFT JOIN biodata_siswa b ON b.user_id = u.id
       WHERE u.id = ? AND u.role = 'calon_siswa'`,
      [Number(session.sub)]
    );
    if (!rows[0]) return Response.json({ message: "Data siswa tidak ditemukan." }, { status: 404 });
    return Response.json({ profile: rows[0] });
  } catch (error) {
    console.error("Get profil siswa error:", error);
    return Response.json({ message: "Gagal memuat profil siswa." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getStudent();
    if (!session) return Response.json({ message: "Akses hanya untuk calon siswa." }, { status: 403 });
    const body = await request.json();
    const required = ["tempat_lahir", "tanggal_lahir", "jenis_kelamin", "alamat", "asal_sekolah", "nama_orang_tua", "whatsapp_orang_tua"];
    const values = Object.fromEntries(required.map((key) => [key, typeof body[key] === "string" ? body[key].trim() : ""]));
    if (required.some((key) => !values[key])) {
      return Response.json({ message: "Lengkapi semua kolom biodata." }, { status: 400 });
    }
    if (values.jenis_kelamin !== "L" && values.jenis_kelamin !== "P") {
      return Response.json({ message: "Jenis kelamin tidak valid." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.tanggal_lahir) || Number.isNaN(Date.parse(values.tanggal_lahir))) {
      return Response.json({ message: "Tanggal lahir tidak valid." }, { status: 400 });
    }
    if (!/^(\+62|62|0)8\d{8,12}$/.test(values.whatsapp_orang_tua.replace(/[\s-]/g, ""))) {
      return Response.json({ message: "Nomor WhatsApp orang tua tidak valid." }, { status: 400 });
    }

    await pool.execute(
      `INSERT INTO biodata_siswa
       (user_id, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, asal_sekolah, nama_orang_tua, whatsapp_orang_tua)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tempat_lahir = VALUES(tempat_lahir), tanggal_lahir = VALUES(tanggal_lahir),
         jenis_kelamin = VALUES(jenis_kelamin), alamat = VALUES(alamat), asal_sekolah = VALUES(asal_sekolah),
         nama_orang_tua = VALUES(nama_orang_tua), whatsapp_orang_tua = VALUES(whatsapp_orang_tua)`,
      [Number(session.sub), ...required.map((key) => values[key])]
    );
    return Response.json({ message: "Biodata berhasil disimpan." });
  } catch (error) {
    console.error("Save profil siswa error:", error);
    return Response.json({ message: "Gagal menyimpan biodata." }, { status: 500 });
  }
}
