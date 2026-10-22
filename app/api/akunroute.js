import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
// ASUMSI: sesuaikan dua import ini dengan proyek Anda.
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth"; // harus mengembalikan user admin, atau null kalau bukan admin

const ROLE_BOLEH = ["KEPSEK", "SISWA"];

const PILIH = { id: true, name: true, email: true, role: true, aktif: true, createdAt: true };

// GET /api/admin/akun?role=KEPSEK|SISWA&q=kata
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const q = (searchParams.get("q") || "").trim();

  if (!ROLE_BOLEH.includes(role)) {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  }

  const akun = await prisma.user.findMany({
    where: {
      role,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    select: PILIH,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ akun });
}

// POST /api/admin/akun  { name, email, password, role }
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = body.role;

  if (!ROLE_BOLEH.includes(role)) {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  }
  if (!name || !email) {
    return NextResponse.json({ error: "Nama dan email wajib diisi." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }

  const ada = await prisma.user.findUnique({ where: { email } });
  if (ada) {
    return NextResponse.json({ error: "Email sudah dipakai akun lain." }, { status: 409 });
  }

  const akun = await prisma.user.create({
    data: { name, email, role, aktif: true, password: await bcrypt.hash(password, 10) },
    select: PILIH,
  });

  return NextResponse.json({ akun, message: "Akun ditambahkan." }, { status: 201 });
}