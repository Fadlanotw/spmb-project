import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Awalan alamat -> role yang boleh masuk.
// Halaman baru di dalam folder ini otomatis ikut terlindungi.
const ROLE_PATHS = {
  "/dashboard/admin": "admin",
  "/dashboard/kepsek": "kepsek",
  "/dashboard/calon-siswa": "calon_siswa",
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const match = Object.entries(ROLE_PATHS).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Alamat di luar tiga dashboard di atas tidak dicek di sini.
  if (!match) return NextResponse.next();

  const [, requiredRole] = match;
  const token = request.cookies.get("spmb_session")?.value;
  const session = await getSession(token);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.role !== requiredRole) {
    return NextResponse.redirect(
      new URL("/login?error=akses-ditolak", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};