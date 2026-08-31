"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Workplace } from "@/lib/db/schema";
import { formatCurrency, totalMonthlyExpenses } from "@/lib/format";
import { deleteWorkplaceAction } from "@/lib/actions/workplace";
import { WorkplaceFormModal } from "@/components/workplace-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function WorkplacesView({
  initialWorkplaces,
}: {
  initialWorkplaces: Workplace[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<Workplace[]>(initialWorkplaces);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Workplace | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(w: Workplace) {
    setEditing(w);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteWorkplaceAction(deleteId);
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: res.error,
        });
        return;
      }
      setItems((prev) => prev.filter((w) => w.id !== deleteId));
      toast({ title: "Lugar eliminado" });
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const grandTotal = items.reduce((acc, w) => acc + totalMonthlyExpenses(w), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Locales</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus lugares de trabajo y sus gastos mensuales.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar lugar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Lugares registrados" value={String(items.length)} />
        <StatCard
          label="Gasto mensual total"
          value={formatCurrency(grandTotal)}
          accent
        />
        <StatCard
          label="Promedio por lugar"
          value={
            items.length
              ? formatCurrency(grandTotal / items.length)
              : formatCurrency(0)
          }
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Dirección</TableHead>
                <TableHead className="text-right">Gastos mensuales</TableHead>
                <TableHead className="w-[120px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40">
                    <EmptyState onAdd={openCreate} />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Store className="h-4 w-4" />
                        </span>
                        <span>{w.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {w.address ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {w.address}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {formatCurrency(totalMonthlyExpenses(w))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(w)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(w.id)}
                          aria-label="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <WorkplaceFormModal
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        workplace={editing}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Eliminar lugar"
        description="¿Seguro que deseas eliminar este lugar de trabajo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${accent ? "bg-emerald-50" : "bg-card"}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-emerald-700" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Store className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">No tenés lugares de trabajo</p>
        <p className="text-sm text-muted-foreground">
          Agregá tu primer lugar para empezar.
        </p>
      </div>
      <Button
        onClick={onAdd}
        size="sm"
        className="bg-emerald-600 text-white hover:bg-emerald-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar lugar
      </Button>
    </div>
  );
}
