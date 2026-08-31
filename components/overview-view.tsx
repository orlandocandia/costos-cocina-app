"use client";

import { Store, Package, Wallet, TrendingUp } from "lucide-react";
import type { Ingredient, Workplace } from "@/lib/db/schema";
import { formatCurrency, totalMonthlyExpenses, unitLabel } from "@/lib/format";

export function OverviewView({
  workplaces,
  ingredients,
}: {
  workplaces: Workplace[];
  ingredients: Ingredient[];
}) {
  const grandTotal = workplaces.reduce(
    (acc, w) => acc + totalMonthlyExpenses(w),
    0,
  );
  const avgIngredientCost =
    ingredients.length > 0
      ? ingredients.reduce((acc, i) => acc + i.costPerUnit, 0) /
        ingredients.length
      : 0;

  const topExpensiveWorkplaces = [...workplaces]
    .sort((a, b) => totalMonthlyExpenses(b) - totalMonthlyExpenses(a))
    .slice(0, 5);

  const recentIngredients = [...ingredients]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          Vista general de tu actividad.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Store className="h-5 w-5" />}
          label="Lugares de trabajo"
          value={String(workplaces.length)}
          tint="emerald"
        />
        <Kpi
          icon={<Package className="h-5 w-5" />}
          label="Insumos en despensa"
          value={String(ingredients.length)}
          tint="amber"
        />
        <Kpi
          icon={<Wallet className="h-5 w-5" />}
          label="Gasto mensual total"
          value={formatCurrency(grandTotal)}
          tint="emerald"
        />
        <Kpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="Costo promedio insumo"
          value={formatCurrency(avgIngredientCost)}
          tint="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">
            Locales con mayor gasto
          </h2>
          {topExpensiveWorkplaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay locales registrados.
            </p>
          ) : (
            <ul className="space-y-3">
              {topExpensiveWorkplaces.map((w) => {
                const total = totalMonthlyExpenses(w);
                const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                return (
                  <li key={w.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{w.name}</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Insumos recientes</h2>
          {recentIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay insumos registrados.
            </p>
          ) : (
            <ul className="divide-y">
              {recentIngredients.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.category ?? "Sin categoría"} · {unitLabel(i.unit)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(i.costPerUnit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: "emerald" | "amber";
}) {
  const tints =
    tint === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";
  return (
    <div className="rounded-xl border bg-card p-5">
      <div
        className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-lg ${tints}`}
      >
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
