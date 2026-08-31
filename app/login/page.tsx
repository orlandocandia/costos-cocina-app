"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ChefHat, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SiteFooter } from "@/components/site-footer";
import { USER_DISABLED_MESSAGE } from "@/lib/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      // NextAuth propaga los `throw new Error(...)` del authorize como `error`.
      if (!res || res.error) {
        const message =
          res?.error === "USER_DISABLED"
            ? USER_DISABLED_MESSAGE
            : "Email o contraseña incorrectos.";
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: message,
        });
        return;
      }
      toast({ title: "Bienvenido de nuevo" });
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        <BrandPanel />
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <ChefHat className="h-7 w-7 text-emerald-600" />
              <span className="text-lg font-bold">Costos de Cocina</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresá con tu email y contraseña.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vos@ejemplo.com"
                    className="pl-9"
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/recovery"
                    className="text-xs font-medium text-emerald-700 underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-9"
                    autoComplete="current-password"
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ingresar
              </Button>
            </form>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-emerald-700 p-10 text-white lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.5) 0, transparent 35%)",
        }}
      />
      <div className="relative flex items-center gap-2">
        <ChefHat className="h-8 w-8" />
        <span className="text-xl font-bold">Costos de Cocina</span>
      </div>
      <div className="relative space-y-4">
        <h2 className="text-3xl font-bold leading-tight">
          Controlá los costos de tu cocina de forma simple.
        </h2>
        <p className="text-emerald-50/90">
          Gestioná tus lugares de trabajo, sus gastos mensuales y la despensa de
          insumos en un solo lugar.
        </p>
        <ul className="space-y-2 text-sm text-emerald-50/90">
          <li>· ABM de locales y gastos mensuales</li>
          <li>· Despensa de insumos con búsqueda</li>
          <li>· Resumen con totales y promedios</li>
        </ul>
      </div>
      <p className="relative text-xs text-emerald-50/70">
        © {new Date().getFullYear()} Costos de Cocina
      </p>
    </div>
  );
}
