"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { ActionResult } from "./types";
import { zodFieldErrors } from "./types";

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

const updateProfileSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
});

/**
 * Actualiza el nombre del usuario autenticado.
 */
export async function updateProfileAction(
  formData: FormData,
): Promise<ActionResult<{ name: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const parsed = updateProfileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const [updated] = await db
    .update(users)
    .set({ name: parsed.data.name.trim() })
    .where(eq(users.id, userId))
    .returning({ name: users.name });

  if (!updated) return { ok: false, error: "Usuario no encontrado" };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true, data: { name: updated.name ?? "" } };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
  newPassword: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

/**
 * Cambia la contraseña del usuario autenticado.
 * Verifica la contraseña actual antes de permitir el cambio.
 */
export async function changePasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "No autorizado" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return {
      ok: false,
      error: "La nueva contraseña debe ser distinta a la actual.",
      fieldErrors: { newPassword: "Debe ser distinta a la actual" },
    };
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return { ok: false, error: "Usuario no encontrado" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return {
      ok: false,
      error: "La contraseña actual es incorrecta.",
      fieldErrors: { currentPassword: "Contraseña incorrecta" },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  return { ok: true, data: undefined };
}
