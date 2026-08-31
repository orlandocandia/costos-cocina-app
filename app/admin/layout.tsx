import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SiteFooter } from "@/components/site-footer";

/**
 * Protege todo /admin. El middleware ya filtra isAdmin, pero este layout
 * es defensa en profundidad: si llegara un no-admin, redirige a /dashboard.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.isAdmin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white text-sm font-bold">
                A
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">Panel de Administración</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Costos de Cocina
                </p>
              </div>
            </div>
            <a
              href="/dashboard"
              className="text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
            >
              ← Volver al dashboard
            </a>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
