"use client";

import { useState } from "react";
import Link from "next/link";
import { ChefHat, Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SiteFooter } from "@/components/site-footer";
import { requestRecoveryAction } from "@/lib/actions/recovery";

export default function RecoveryPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      const res = await requestRecoveryAction(formData);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }
      setDone(true);
      toast({
        title: "Solicitud enviada",
        description:
          "Si el email existe y está activo, recibiste un enlace para restablecer tu contraseña.",
      });
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
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-tight">Revisá tu correo</h1>
              <p className="text-sm text-muted-foreground">
                Si el email <span className="font-medium">{email}</span> existe y
                está activo, te enviamos un enlace para restablecer tu contraseña.
                El enlace vence en 15 minutos.
              </p>
              <p className="text-xs text-muted-foreground">
                ¿No recibiste nada? Revisá el spam o pedí un enlace nuevo.
              </p>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a iniciar sesión
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Recuperar contraseña
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingresá tu email y te enviaremos un enlace para restablecerla.
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar enlace
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 font-medium text-emerald-700 underline-offset-4 hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver a iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
