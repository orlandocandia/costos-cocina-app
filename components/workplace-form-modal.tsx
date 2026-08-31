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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActionResult } from "@/lib/actions/types";
import type { Workplace } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format";
import {
  createWorkplaceAction,
  updateWorkplaceAction,
} from "@/lib/actions/workplace";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workplace?: Workplace | null;
};

type FormData = {
  name: string;
  address: string;
  monthlyRent: string;
  monthlyElectricity: string;
  monthlyGas: string;
  monthlyWater: string;
  monthlyOther: string;
};

const empty: FormData = {
  name: "",
  address: "",
  monthlyRent: "0",
  monthlyElectricity: "0",
  monthlyGas: "0",
  monthlyWater: "0",
  monthlyOther: "0",
};

export function WorkplaceFormModal({ open, onOpenChange, workplace }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!workplace;

  useEffect(() => {
    if (open) {
      setErrors({});
      if (workplace) {
        setForm({
          name: workplace.name,
          address: workplace.address ?? "",
          monthlyRent: String(workplace.monthlyRent),
          monthlyElectricity: String(workplace.monthlyElectricity),
          monthlyGas: String(workplace.monthlyGas),
          monthlyWater: String(workplace.monthlyWater),
          monthlyOther: String(workplace.monthlyOther),
        });
      } else {
        setForm(empty);
      }
    }
  }, [open, workplace]);

  const totalPreview =
    (Number(form.monthlyRent) || 0) +
    (Number(form.monthlyElectricity) || 0) +
    (Number(form.monthlyGas) || 0) +
    (Number(form.monthlyWater) || 0) +
    (Number(form.monthlyOther) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", form.name);
      formData.set("address", form.address);
      formData.set("monthlyRent", form.monthlyRent);
      formData.set("monthlyElectricity", form.monthlyElectricity);
      formData.set("monthlyGas", form.monthlyGas);
      formData.set("monthlyWater", form.monthlyWater);
      formData.set("monthlyOther", form.monthlyOther);

      const res: ActionResult<Workplace> = isEdit && workplace
        ? await updateWorkplaceAction(workplace.id, formData)
        : await createWorkplaceAction(formData);

      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast({ variant: "destructive", title: "Error", description: res.error });
        return;
      }

      toast({
        title: isEdit ? "Lugar actualizado" : "Lugar creado",
        description: form.name,
      });
      onOpenChange(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error inesperado" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar lugar" : "Agregar lugar de trabajo"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del lugar y sus gastos mensuales."
              : "Registra un nuevo lugar de trabajo y sus gastos mensuales."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wp-name">Nombre *</Label>
            <Input
              id="wp-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Cocina central"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-address">Dirección</Label>
            <Input
              id="wp-address"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="Opcional"
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MoneyField
              id="wp-rent"
              label="Alquiler mensual"
              value={form.monthlyRent}
              onChange={(v) => setForm((f) => ({ ...f, monthlyRent: v }))}
              error={errors.monthlyRent}
            />
            <MoneyField
              id="wp-elec"
              label="Electricidad"
              value={form.monthlyElectricity}
              onChange={(v) => setForm((f) => ({ ...f, monthlyElectricity: v }))}
              error={errors.monthlyElectricity}
            />
            <MoneyField
              id="wp-gas"
              label="Gas"
              value={form.monthlyGas}
              onChange={(v) => setForm((f) => ({ ...f, monthlyGas: v }))}
              error={errors.monthlyGas}
            />
            <MoneyField
              id="wp-water"
              label="Agua"
              value={form.monthlyWater}
              onChange={(v) => setForm((f) => ({ ...f, monthlyWater: v }))}
              error={errors.monthlyWater}
            />
            <MoneyField
              id="wp-other"
              label="Otros"
              value={form.monthlyOther}
              onChange={(v) => setForm((f) => ({ ...f, monthlyOther: v }))}
              error={errors.monthlyOther}
            />
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total gastos mensuales</span>
              <span className="font-semibold text-emerald-700">
                {formatCurrency(totalPreview)}
              </span>
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
              {isEdit ? "Guardar cambios" : "Crear lugar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MoneyField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
