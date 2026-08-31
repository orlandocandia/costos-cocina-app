"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Store,
  Package,
  LogOut,
  Menu,
  ChefHat,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = session?.user?.isAdmin === true;

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
    { href: "/dashboard/workplaces", label: "Mis Locales", icon: Store },
    { href: "/dashboard/ingredients", label: "Mi Despensa", icon: Package },
    { href: "/dashboard/profile", label: "Mi Perfil", icon: UserCircle },
    ...(isAdmin
      ? [{ href: "/admin/users", label: "Admin · Usuarios", icon: ShieldCheck }]
      : []),
  ];

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="space-y-1">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-600 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-emerald-600" />
                    Costos de Cocina
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-4 p-3">
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                  <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-emerald-600" />
              <span className="text-lg font-bold">Costos de Cocina</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">
                {session?.user?.name ?? "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {session?.user?.email}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-3">
            <NavLinks />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
