// Helper untuk Server Component: cek login + role di SERVER.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function requireRole(allowedRole) {
  const cookieStore = await cookies(); // Next.js 15+: cookies() async. (Next 14: hapus await juga tidak masalah)
  const token = cookieStore.get("spmb_session")?.value;
  const session = await getSession(token);

  if (!session) {
    redirect("/login");
  }

  if (session.role !== allowedRole) {
    redirect("/login?error=akses-ditolak");
  }

  return session;
}
