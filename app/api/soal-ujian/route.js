import { cookies } from "next/headers";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

async function getUserSession() {
  const cookieStore = await cookies();
  return getSession(cookieStore.get("spmb_session")?.value);
}

function toQuestion(row, includeAnswer = false) {
  const question = {
    id: row.id,
    kategori: row.kategori,
    pertanyaan: row.pertanyaan,
    opsi: {
      A: row.opsi_a,
      B: row.opsi_b,
      C: row.opsi_c,
      D: row.opsi_d,
    },
  };

  if (includeAnswer) question.jawabanBenar = row.jawaban_benar;
  return question;
}

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) return Response.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
    if (!["admin", "calon_siswa"].includes(session.role)) {
      return Response.json({ message: "Anda tidak memiliki akses." }, { status: 403 });
    }

    const [[settings]] = await pool.execute(
      "SELECT aktif FROM pengaturan_ujian WHERE id = 1"
    );
    const aktif = Boolean(settings?.aktif);
    const [rows] = await pool.execute(
      `SELECT id, kategori, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar
       FROM soal_ujian ORDER BY id`
    );
    const questions = session.role === "admin"
      ? rows.map((row) => toQuestion(row, true))
      : aktif
        ? rows.map((row) => toQuestion(row))
        : [];

    return Response.json({ aktif, totalSoal: rows.length, questions });
  } catch (error) {
    console.error("Get soal ujian error:", error);
    return Response.json({ message: "Gagal memuat soal ujian." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getUserSession();
    if (!session) return Response.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
    if (session.role !== "admin") {
      return Response.json({ message: "Hanya admin yang dapat mengatur soal ujian." }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body.aktif !== "boolean") {
      return Response.json({ message: "Status aktif tidak valid." }, { status: 400 });
    }

    await pool.execute(
      "UPDATE pengaturan_ujian SET aktif = ? WHERE id = 1",
      [body.aktif ? 1 : 0]
    );

    return Response.json({
      message: body.aktif
        ? "Semua soal ujian berhasil diaktifkan untuk calon siswa."
        : "Soal ujian berhasil dinonaktifkan.",
      aktif: body.aktif,
    });
  } catch (error) {
    console.error("Update status soal ujian error:", error);
    return Response.json({ message: "Gagal memperbarui status soal ujian." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getUserSession();
    if (!session) return Response.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 });
    if (session.role !== "calon_siswa") {
      return Response.json({ message: "Hanya calon siswa yang dapat mengerjakan tes." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.jawaban || typeof body.jawaban !== "object" || Array.isArray(body.jawaban)) {
      return Response.json({ message: "Jawaban ujian tidak valid." }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[settings]] = await connection.execute(
        "SELECT aktif FROM pengaturan_ujian WHERE id = 1 FOR UPDATE"
      );
      if (!settings?.aktif) {
        await connection.rollback();
        return Response.json({ message: "Tes belum diaktifkan oleh admin." }, { status: 403 });
      }

      const [questions] = await connection.execute(
        "SELECT id, jawaban_benar FROM soal_ujian ORDER BY id"
      );
      if (questions.length === 0) {
        await connection.rollback();
        return Response.json({ message: "Belum ada soal yang tersedia." }, { status: 409 });
      }

      const validIds = new Set(questions.map((question) => String(question.id)));
      const entries = Object.entries(body.jawaban);
      if (
        entries.length > questions.length ||
        entries.some(([id, answer]) => !validIds.has(id) || !["A", "B", "C", "D"].includes(answer))
      ) {
        await connection.rollback();
        return Response.json({ message: "Jawaban ujian tidak valid." }, { status: 400 });
      }

      const correct = questions.reduce(
        (total, question) => total + (body.jawaban[String(question.id)] === question.jawaban_benar ? 1 : 0),
        0
      );
      const nilai = Number(((correct / questions.length) * 100).toFixed(2));
      await connection.execute(
        `INSERT INTO hasil_ujian (user_id, jumlah_soal, jawaban_benar, nilai, jawaban)
         VALUES (?, ?, ?, ?, ?)`,
        [Number(session.sub), questions.length, correct, nilai, JSON.stringify(body.jawaban)]
      );
      await connection.commit();

      return Response.json({ message: "Jawaban berhasil dikumpulkan.", totalSoal: questions.length, benar: correct, nilai });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Submit soal ujian error:", error);
    return Response.json({ message: "Gagal menyimpan hasil ujian." }, { status: 500 });
  }
}
