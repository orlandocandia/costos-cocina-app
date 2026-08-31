"use server";

import { and, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingredients } from "@/lib/db/schema";
import { ingredientSchema } from "@/lib/validations/ingredient";
import type { ActionResult } from "./types";
import { zodFieldErrors } from "./types";
import type { Ingredient } from "@/lib/db/schema";

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * Devuelve los insumos del usuario. Si `query` se pasa, filtra por nombre o
 * categoría (búsqueda parcial, case-insensitive).
 */
export async function getIngredientsAction(query?: string): Promise<Ingredient[]> {
  const userId = await requireUserId();
  if (!userId) return [];

  const q = query?.trim();
  if (!q) {
    return db.query.ingredients.findMany({
      where: eq(ingredients.userId, userId),
      orderBy: (ingredients, { asc }) => [asc(ingredients.name)],
    });
  }

  return db.query.ingredients.findMany({
    where: and(
      eq(ingredients.userId, userId),
      or(like(ingredients.name, `%${q}%`), like(ingredients.category, `%${q}%`)),
    ),
    orderBy: (ingredients, { asc }) => [asc(ingredients.name)],
  });
}

export async function createIngredientAction(
  formData: FormData,
): Promise<ActionResult<Ingredient>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || null,
    unit: formData.get("unit"),
    costPerUnit: formData.get("costPerUnit"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const [created] = await db
    .insert(ingredients)
    .values({
      userId,
      name: parsed.data.name.trim(),
      category: parsed.data.category,
      unit: parsed.data.unit,
      costPerUnit: parsed.data.costPerUnit,
    })
    .returning();

  revalidatePath("/dashboard/ingredients");
  revalidatePath("/dashboard");
  return { ok: true, data: created };
}

export async function updateIngredientAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<Ingredient>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const parsed = ingredientSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || null,
    unit: formData.get("unit"),
    costPerUnit: formData.get("costPerUnit"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const [updated] = await db
    .update(ingredients)
    .set({
      name: parsed.data.name.trim(),
      category: parsed.data.category,
      unit: parsed.data.unit,
      costPerUnit: parsed.data.costPerUnit,
    })
    .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
    .returning();

  if (!updated) return { ok: false, error: "Insumo no encontrado" };

  revalidatePath("/dashboard/ingredients");
  revalidatePath("/dashboard");
  return { ok: true, data: updated };
}

export async function deleteIngredientAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const [deleted] = await db
    .delete(ingredients)
    .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
    .returning({ id: ingredients.id });

  if (!deleted) return { ok: false, error: "Insumo no encontrado" };

  revalidatePath("/dashboard/ingredients");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
