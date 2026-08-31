import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  // Si la verificación de sesión falla (ej. DB no configurada aún),
  // mandamos al usuario al login en lugar de mostrar un 500.
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }
  redirect(session ? "/dashboard" : "/login");
}
