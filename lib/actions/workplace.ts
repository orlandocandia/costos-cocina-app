"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workplaces } from "@/lib/db/schema";
import { workplaceSchema } from "@/lib/validations/workplace";
import type { ActionResult } from "./types";
import { zodFieldErrors } from "./types";
import type { Workplace } from "@/lib/db/schema";

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * Devuelve todos los workplaces del usuario autenticado, ordenados por fecha
 * de creación descendente.
 */
export async function getWorkplacesAction(): Promise<Workplace[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  return db.query.workplaces.findMany({
    where: eq(workplaces.userId, userId),
    orderBy: (workplaces, { desc }) => [desc(workplaces.createdAt)],
  });
}

export async function createWorkplaceAction(
  formData: FormData,
): Promise<ActionResult<Workplace>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const parsed = workplaceSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || null,
    monthlyRent: formData.get("monthlyRent"),
    monthlyElectricity: formData.get("monthlyElectricity"),
    monthlyGas: formData.get("monthlyGas"),
    monthlyWater: formData.get("monthlyWater"),
    monthlyOther: formData.get("monthlyOther"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const [created] = await db
    .insert(workplaces)
    .values({
      userId,
      name: parsed.data.name.trim(),
      address: parsed.data.address,
      monthlyRent: parsed.data.monthlyRent,
      monthlyElectricity: parsed.data.monthlyElectricity,
      monthlyGas: parsed.data.monthlyGas,
      monthlyWater: parsed.data.monthlyWater,
      monthlyOther: parsed.data.monthlyOther,
    })
    .returning();

  revalidatePath("/dashboard/workplaces");
  return { ok: true, data: created };
}

export async function updateWorkplaceAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<Workplace>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const parsed = workplaceSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || null,
    monthlyRent: formData.get("monthlyRent"),
    monthlyElectricity: formData.get("monthlyElectricity"),
    monthlyGas: formData.get("monthlyGas"),
    monthlyWater: formData.get("monthlyWater"),
    monthlyOther: formData.get("monthlyOther"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const [updated] = await db
    .update(workplaces)
    .set({
      name: parsed.data.name.trim(),
      address: parsed.data.address,
      monthlyRent: parsed.data.monthlyRent,
      monthlyElectricity: parsed.data.monthlyElectricity,
      monthlyGas: parsed.data.monthlyGas,
      monthlyWater: parsed.data.monthlyWater,
      monthlyOther: parsed.data.monthlyOther,
    })
    .where(and(eq(workplaces.id, id), eq(workplaces.userId, userId)))
    .returning();

  if (!updated) return { ok: false, error: "Lugar no encontrado" };

  revalidatePath("/dashboard/workplaces");
  return { ok: true, data: updated };
}

export async function deleteWorkplaceAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const [deleted] = await db
    .delete(workplaces)
    .where(and(eq(workplaces.id, id), eq(workplaces.userId, userId)))
    .returning({ id: workplaces.id });

  if (!deleted) return { ok: false, error: "Lugar no encontrado" };

  revalidatePath("/dashboard/workplaces");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
