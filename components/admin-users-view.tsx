"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, ShieldCheck, ShieldOff, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { AdminUserView } from "@/lib/actions/admin";
import {
  createUserAction,
  updateUserAction,
  resetUserPasswordAction,
  deleteUserAction,
} from "@/lib/actions/admin";
import { UserFormModal } from "@/components/user-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Props = {
  initialUsers: AdminUserView[];
  currentUserId: string;
};

export function AdminUsersView({ initialUsers, currentUserId }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminUserView[]>(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserView | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUserView | null>(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<{
    user: AdminUserView;
    password: string;
  } | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(u: AdminUserView) {
    setEditing(u);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteUserAction(deleteTarget.id);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }
      setItems((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast({ title: "Usuario eliminado", description: deleteTarget.email });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function confirmReset() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await resetUserPasswordAction(resetTarget.id);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }
      setTempPassword({ user: resetTarget, password: res.data.tempPassword });
      setResetTarget(null);
      toast({ title: "Contraseña reseteada" });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná los usuarios del sistema. Total: {items.length}.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Crear usuario
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="max-h-[65vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="w-[180px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    No hay usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
                            <UserIcon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-medium">
                              {u.name ?? "—"}
                              {isSelf && (
                                <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Desactivado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.isAdmin ? (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldOff className="h-3 w-3" />
                            Usuario
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(u)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setResetTarget(u)}
                            aria-label="Resetear contraseña"
                            title="Resetear contraseña"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(u)}
                            aria-label="Eliminar"
                            className="text-destructive hover:text-destructive"
                            disabled={isSelf}
                            title={isSelf ? "No podés eliminar tu propia cuenta" : "Eliminar"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserFormModal
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        user={editing}
        onCreated={(u) => setItems((prev) => [u, ...prev])}
        onUpdated={(u) =>
          setItems((prev) => prev.map((it) => (it.id === u.id ? u : it)))
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Eliminar usuario"
        description={`¿Seguro que deseas eliminar a ${deleteTarget?.email}? Se borrarán también sus lugares e insumos. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(v) => !v && setResetTarget(null)}
        title="Resetear contraseña"
        description={`Se generará una nueva contraseña temporal para ${resetTarget?.email}. Se te mostrará en pantalla para que se la comuniques.`}
        confirmText="Generar"
        loading={resetting}
        onConfirm={confirmReset}
      />

      {tempPassword && (
        <TempPasswordDialog
          data={tempPassword}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  );
}

function TempPasswordDialog({
  data,
  onClose,
}: {
  data: { user: AdminUserView; password: string };
  onClose: () => void;
}) {
  const { toast } = useToast();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">Contraseña temporal generada</h2>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">
          Usuario: <span className="font-medium text-foreground">{data.user.email}</span>
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Comunicale esta contraseña y pedile que la cambie desde su perfil.
        </p>
        <div className="mb-4 rounded-lg border bg-muted/40 p-3">
          <code className="block break-all font-mono text-base font-semibold text-emerald-700">
            {data.password}
          </code>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              void navigator.clipboard.writeText(data.password);
              toast({ title: "Copiado al portapapeles" });
            }}
          >
            Copiar
          </Button>
          <Button onClick={onClose} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
