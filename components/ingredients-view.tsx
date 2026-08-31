"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Ingredient } from "@/lib/db/schema";
import { formatCurrency, unitLabel } from "@/lib/format";
import { deleteIngredientAction } from "@/lib/actions/ingredient";
import { IngredientFormModal } from "@/components/ingredient-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function IngredientsView({
  initialIngredients,
}: {
  initialIngredients: Ingredient[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<Ingredient[]>(initialIngredients);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.category?.toLowerCase().includes(q) ?? false),
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(i: Ingredient) {
    setEditing(i);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteIngredientAction(deleteId);
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: res.error,
        });
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast({ title: "Insumo eliminado" });
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Despensa</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus insumos y sus costos por unidad.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar insumo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o categoría..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Costo / unidad</TableHead>
                <TableHead className="w-[120px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40">
                    <EmptyState
                      onAdd={openCreate}
                      hasQuery={query.trim().length > 0}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700">
                          <Package className="h-4 w-4" />
                        </span>
                        <span>{i.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {i.category ? (
                        <Badge variant="secondary">{i.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {unitLabel(i.unit)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(i.costPerUnit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(i)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(i.id)}
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

      <IngredientFormModal
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        ingredient={editing}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Eliminar insumo"
        description="¿Seguro que deseas eliminar este insumo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function EmptyState({
  onAdd,
  hasQuery,
}: {
  onAdd: () => void;
  hasQuery: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">
          {hasQuery ? "Sin resultados" : "No tenés insumos"}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasQuery
            ? "Probá con otro término de búsqueda."
            : "Agregá tu primer insumo para empezar."}
        </p>
      </div>
      {!hasQuery && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar insumo
        </Button>
      )}
    </div>
  );
}
