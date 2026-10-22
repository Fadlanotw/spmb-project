import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export async function requireKepsekApi() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("spmb_session")?.value);

  if (!session) {
    return { response: Response.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 }) };
  }
  if (session.role !== "kepsek") {
    return { response: Response.json({ message: "Akses hanya untuk kepala sekolah." }, { status: 403 }) };
  }

  return { session };
}
