"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActionResult } from "@/lib/actions/types";
import type { AdminUserView } from "@/lib/actions/admin";
import {
  createUserAction,
  updateUserAction,
} from "@/lib/actions/admin";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user?: AdminUserView | null;
  onCreated?: (u: AdminUserView) => void;
  onUpdated?: (u: AdminUserView) => void;
};

type FormData = {
  email: string;
  name: string;
  password: string;
  isActive: "true" | "false";
  isAdmin: "true" | "false";
};

const empty: FormData = {
  email: "",
  name: "",
  password: "",
  isActive: "true",
  isAdmin: "false",
};

export function UserFormModal({ open, onOpenChange, user, onCreated, onUpdated }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!user;

  useEffect(() => {
    if (open) {
      setErrors({});
      if (user) {
        setForm({
          email: user.email,
          name: user.name ?? "",
          password: "",
          isActive: user.isActive ? "true" : "false",
          isAdmin: user.isAdmin ? "true" : "false",
        });
      } else {
        setForm(empty);
      }
    }
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", form.email);
      formData.set("name", form.name);
      formData.set("isActive", form.isActive);
      formData.set("isAdmin", form.isAdmin);
      if (!isEdit) formData.set("password", form.password);

      const res: ActionResult<AdminUserView | { user: AdminUserView; tempPassword: string }> =
        isEdit && user
          ? await updateUserAction(user.id, formData)
          : await createUserAction(formData);

      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }

      if (isEdit && user) {
        onUpdated?.(res.data as AdminUserView);
        toast({ title: "Usuario actualizado", description: form.email });
      } else {
        const created = res.data as { user: AdminUserView; tempPassword: string };
        onCreated?.(created.user);
        toast({
          title: "Usuario creado",
          description: `Contraseña temporal: ${created.tempPassword}`,
        });
      }
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Error inesperado" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuario" : "Crear usuario"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modificá los datos del usuario."
              : "Creá un nuevo usuario. Se le asignará una contraseña temporal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-name">Nombre *</Label>
            <Input
              id="u-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del usuario"
              autoFocus
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-email">Email *</Label>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="vos@ejemplo.com"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="u-password">Contraseña temporal *</Label>
              <Input
                id="u-password"
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="u-active">Estado</Label>
              <Select
                value={form.isActive}
                onValueChange={(v) => setForm((f) => ({ ...f, isActive: v as "true" | "false" }))}
              >
                <SelectTrigger id="u-active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Desactivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-admin">Rol</Label>
              <Select
                value={form.isAdmin}
                onValueChange={(v) => setForm((f) => ({ ...f, isAdmin: v as "true" | "false" }))}
              >
                <SelectTrigger id="u-admin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Usuario</SelectItem>
                  <SelectItem value="true">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
