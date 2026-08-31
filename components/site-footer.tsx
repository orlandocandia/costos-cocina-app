"use client";

import { ChefHat } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-emerald-600" />
          <span>Costos de Cocina</span>
        </div>
        <p className="text-center sm:text-right">
          Gestión de lugares de trabajo e insumos · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
