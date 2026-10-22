import pool from "@/lib/db";
import bcrypt from "bcryptjs";

const JURUSAN_VALID = ["PPLG", "MPLB", "PM"];

export async function POST(request) {
  try {
    const body = await request.json();
    const nama = body.nama?.trim();
    const email = body.email?.trim().toLowerCase();
    const nisn = body.nisn?.trim();
    const whatsapp = body.whatsapp?.replace(/[\s-]/g, "");
    const jurusan = body.jurusan;
    const password = body.password;

    if (
      !nama ||
      !email ||
      !nisn ||
      !whatsapp ||
      !jurusan ||
      typeof password !== "string"
    ) {
      return Response.json(
        { message: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    if (nama.length > 100 || email.length > 150) {
      return Response.json(
        { message: "Nama atau email terlalu panjang." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(nisn)) {
      return Response.json(
        { message: "NISN harus 10 digit angka." },
        { status: 400 }
      );
    }

    if (!/^(\+62|62|0)8\d{8,12}$/.test(whatsapp)) {
      return Response.json(
        { message: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    // Jurusan dicek di server, bukan hanya di dropdown.
    if (!JURUSAN_VALID.includes(jurusan)) {
      return Response.json(
        { message: "Jurusan tidak valid." },
        { status: 400 }
      );
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return Response.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const [existingEmail] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return Response.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    const [existingNisn] = await pool.execute(
      "SELECT id FROM users WHERE nisn = ?",
      [nisn]
    );

    if (existingNisn.length > 0) {
      return Response.json(
        { message: "NISN sudah terdaftar." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Role ditentukan oleh server, bukan oleh form.
    await pool.execute(
      `INSERT INTO users (nama, email, nisn, whatsapp, jurusan, password, role)
       VALUES (?, ?, ?, ?, ?, ?, 'calon_siswa')`,
      [nama, email, nisn, whatsapp, jurusan, hashedPassword]
    );

    return Response.json(
      { message: "Registrasi calon siswa berhasil." },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const pesan = String(error.message).includes("nisn")
        ? "NISN sudah terdaftar."
        : "Email sudah terdaftar.";

      return Response.json({ message: pesan }, { status: 409 });
    }

    console.error("Register error:", error);

    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}