"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ChefHat, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SiteFooter } from "@/components/site-footer";
import { registerAction } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/types";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("password", password);

      const res: ActionResult<{ name: string; email: string }> =
        await registerAction(null, formData);

      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({
          variant: "destructive",
          title: "Error al registrarse",
          description: res.error,
        });
        return;
      }

      // Iniciar sesión automáticamente tras el registro.
      const signRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signRes || signRes.error) {
        toast({
          title: "Cuenta creada",
          description: "Iniciá sesión para continuar.",
        });
        router.push("/login");
        return;
      }

      toast({ title: "¡Bienvenido!", description: "Cuenta creada correctamente." });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <ChefHat className="h-7 w-7 text-emerald-600" />
              <span className="text-lg font-bold">Costos de Cocina</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Completá tus datos para registrarte.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="pl-9"
                    autoComplete="name"
                    required
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

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
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-9"
                    autoComplete="new-password"
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
                Registrarme
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden flex-col justify-between overflow-hidden bg-amber-600 p-10 text-white lg:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 70% 20%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.5) 0, transparent 35%)",
            }}
          />
          <div className="relative flex items-center gap-2">
            <ChefHat className="h-8 w-8" />
            <span className="text-xl font-bold">Costos de Cocina</span>
          </div>
          <div className="relative space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Empezá a controlar tus costos hoy.
            </h2>
            <p className="text-amber-50/90">
              Registrá tus lugares de trabajo y tu despensa de insumos. Accedé a
              tus números desde cualquier lugar.
            </p>
          </div>
          <p className="relative text-xs text-amber-50/70">
            © {new Date().getFullYear()} Costos de Cocina
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
