import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
// ASUMSI: sesuaikan dua import ini dengan proyek Anda.
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PILIH = { id: true, name: true, email: true, role: true, aktif: true };
const ROLE_BOLEH = ["KEPSEK", "SISWA"];

// Hanya akun KEPSEK dan SISWA yang boleh dikelola dari sini.
async function ambilAkun(id) {
  const akun = await prisma.user.findUnique({ where: { id } });
  return akun && ROLE_BOLEH.includes(akun.role) ? akun : null;
}

// PATCH /api/admin/akun/:id  { name?, email?, password?, aktif? }
export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const akun = await ambilAkun(id);
  if (!akun) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Nama tidak boleh kosong." }, { status: 400 });
    data.name = name;
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    const dipakai = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (dipakai) return NextResponse.json({ error: "Email sudah dipakai akun lain." }, { status: 409 });
    data.email = email;
  }

  if (body.password !== undefined) {
    if (String(body.password).length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }
    data.password = await bcrypt.hash(String(body.password), 10);
  }

  if (body.aktif !== undefined) data.aktif = Boolean(body.aktif);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
  }

  const baru = await prisma.user.update({ where: { id }, data, select: PILIH });
  return NextResponse.json({ akun: baru });
}

// DELETE /api/admin/akun/:id
// Siswa yang sudah punya tagihan hanya dinonaktifkan supaya riwayat pembayaran tetap ada.
export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { id } = await params;
  const akun = await ambilAkun(id);
  if (!akun) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

  if (akun.role === "SISWA") {
    // ASUMSI: model tagihan punya kolom userId. Ganti sesuai skema Anda.
    const jumlahTagihan = await prisma.tagihan.count({ where: { userId: id } });
    if (jumlahTagihan > 0) {
      await prisma.user.update({ where: { id }, data: { aktif: false } });
      return NextResponse.json({
        message: "Siswa punya data tagihan, jadi akunnya dinonaktifkan, bukan dihapus.",
      });
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Akun dihapus." });
}