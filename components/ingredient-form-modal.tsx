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
import type { Ingredient, IngredientUnit } from "@/lib/db/schema";
import { UNIT_OPTIONS } from "@/lib/format";
import {
  createIngredientAction,
  updateIngredientAction,
} from "@/lib/actions/ingredient";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredient?: Ingredient | null;
};

type FormData = {
  name: string;
  category: string;
  unit: IngredientUnit;
  costPerUnit: string;
};

const empty: FormData = {
  name: "",
  category: "",
  unit: "kg",
  costPerUnit: "",
};

export function IngredientFormModal({ open, onOpenChange, ingredient }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!ingredient;

  useEffect(() => {
    if (open) {
      setErrors({});
      if (ingredient) {
        setForm({
          name: ingredient.name,
          category: ingredient.category ?? "",
          unit: ingredient.unit as IngredientUnit,
          costPerUnit: String(ingredient.costPerUnit),
        });
      } else {
        setForm(empty);
      }
    }
  }, [open, ingredient]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", form.name);
      formData.set("category", form.category);
      formData.set("unit", form.unit);
      formData.set("costPerUnit", form.costPerUnit);

      const res: ActionResult<Ingredient> =
        isEdit && ingredient
          ? await updateIngredientAction(ingredient.id, formData)
          : await createIngredientAction(formData);

      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }

      toast({
        title: isEdit ? "Insumo actualizado" : "Insumo creado",
        description: form.name,
      });
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Error inesperado" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar insumo" : "Agregar insumo"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del insumo."
              : "Registra un nuevo insumo en tu despensa."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ing-name">Nombre *</Label>
            <Input
              id="ing-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Harina 000"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ing-cat">Categoría</Label>
            <Input
              id="ing-cat"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              placeholder="Ej. Harinas"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ing-unit">Unidad *</Label>
              <Select
                value={form.unit}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, unit: v as IngredientUnit }))
                }
              >
                <SelectTrigger id="ing-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ing-cost">Costo por unidad *</Label>
              <Input
                id="ing-cost"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.costPerUnit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, costPerUnit: e.target.value }))
                }
                placeholder="0.00"
              />
              {errors.costPerUnit && (
                <p className="text-sm text-destructive">{errors.costPerUnit}</p>
              )}
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
              {isEdit ? "Guardar cambios" : "Crear insumo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
