"use client";

import { useState } from "react";
import { User as UserIcon, Lock, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/profile";

type Props = {
  initialName: string;
  email: string;
};

export function ProfileView({ initialName, email }: Props) {
  const { toast } = useToast();

  // Perfil
  const [name, setName] = useState(initialName);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileErrors({});
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      const res = await updateProfileAction(formData);
      if (!res.ok) {
        setProfileErrors(res.fieldErrors ?? {});
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }
      toast({ title: "Perfil actualizado", description: res.data.name });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwErrors({});
    if (newPassword !== confirmPassword) {
      setPwErrors({ confirmPassword: "Las contraseñas no coinciden" });
      return;
    }
    setPwLoading(true);
    try {
      const formData = new FormData();
      formData.set("currentPassword", currentPassword);
      formData.set("newPassword", newPassword);
      const res = await changePasswordAction(formData);
      if (!res.ok) {
        setPwErrors(res.fieldErrors ?? {});
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }
      toast({ title: "Contraseña actualizada" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Editá tu nombre y contraseña.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Datos del perfil */}
        <section className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">Datos personales</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="p-email"
                  value={email}
                  disabled
                  className="pl-9 bg-muted/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El email no se puede cambiar. Contactá al administrador.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-name">Nombre</Label>
              <Input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
              {profileErrors.name && (
                <p className="text-sm text-destructive">{profileErrors.name}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={profileLoading}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </form>
        </section>

        {/* Cambio de contraseña */}
        <section className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur-pw">Contraseña actual</Label>
              <Input
                id="cur-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {pwErrors.currentPassword && (
                <p className="text-sm text-destructive">{pwErrors.currentPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">Nueva contraseña</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                required
              />
              {pwErrors.newPassword && (
                <p className="text-sm text-destructive">{pwErrors.newPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="conf-pw">Repetir nueva contraseña</Label>
              <Input
                id="conf-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {pwErrors.confirmPassword && (
                <p className="text-sm text-destructive">{pwErrors.confirmPassword}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={pwLoading}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {pwLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
