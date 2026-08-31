export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function totalMonthlyExpenses(w: {
  monthlyRent: number;
  monthlyElectricity: number;
  monthlyGas: number;
  monthlyWater: number;
  monthlyOther: number;
}): number {
  return (
    (w.monthlyRent || 0) +
    (w.monthlyElectricity || 0) +
    (w.monthlyGas || 0) +
    (w.monthlyWater || 0) +
    (w.monthlyOther || 0)
  );
}

const UNIT_LABELS: Record<string, string> = {
  kg: "Kg",
  liter: "Litro",
  unit: "Unidad",
  package: "Paquete",
  can: "Lata",
};

export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit;
}

export const UNIT_OPTIONS = [
  { value: "kg", label: "Kg" },
  { value: "liter", label: "Litro" },
  { value: "unit", label: "Unidad" },
  { value: "package", label: "Paquete" },
  { value: "can", label: "Lata" },
] as const;
