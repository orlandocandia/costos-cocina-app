"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SiteFooter } from "@/components/site-footer";
import { resetPasswordAction } from "@/lib/actions/recovery";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Enlace inválido",
        description: "Falta el token. Pedí un enlace nuevo desde /recovery.",
      });
    }
  }, [token, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Las contraseñas no coinciden" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("newPassword", newPassword);
      const res = await resetPasswordAction(formData);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }
      setDone(true);
      toast({ title: "Contraseña actualizada", description: "Ya podés iniciar sesión." });
      setTimeout(() => router.push("/login"), 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-emerald-600" />
            <span className="text-lg font-bold">Costos de Cocina</span>
          </div>

          {done ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h1 className="text-2xl font-bold tracking-tight">¡Listo!</h1>
              <p className="text-sm text-muted-foreground">
                Tu contraseña se actualizó. Te redirigimos al login…
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Ir a iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Nueva contraseña
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Elegí una nueva contraseña para tu cuenta.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-9"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Repetir contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetí la nueva contraseña"
                      className="pl-9"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Actualizar contraseña
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
