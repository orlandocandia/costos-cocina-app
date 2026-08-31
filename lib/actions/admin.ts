"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateTempPassword } from "@/lib/password-utils";
import type { ActionResult } from "./types";
import { zodFieldErrors } from "./types";
import { z } from "zod";

/**
 * Tipo público de usuario para el panel de admin.
 * Nunca expone passwordHash ni resetToken.
 */
export type AdminUserView = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: number;
};

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isAdmin) return null;
  return { id: session.user.id };
}

function toView(u: typeof users.$inferSelect): AdminUserView {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    isActive: u.isActive,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
  };
}

/**
 * Lista todos los usuarios (solo admin).
 */
export async function getUsersAction(): Promise<ActionResult<AdminUserView[]>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado" };
  const all = await db.select().from(users).orderBy(users.createdAt);
  return { ok: true, data: all.map(toView) };
}

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

/**
 * Crea un usuario nuevo desde el panel de admin.
 * Por defecto isActive=true, isAdmin=false.
 */
export async function createUserAction(
  formData: FormData,
): Promise<ActionResult<{ user: AdminUserView; tempPassword: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado" };

  const parsed = createUserSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return {
      ok: false,
      error: "Ya existe un usuario con ese email",
      fieldErrors: { email: "Email ya registrado" },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: parsed.data.name.trim(),
      passwordHash,
      isActive: true,
      isAdmin: false,
    })
    .returning();

  revalidatePath("/admin/users");
  return { ok: true, data: { user: toView(created), tempPassword: parsed.data.password } };
}

const updateUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
  isActive: z.enum(["true", "false"]),
  isAdmin: z.enum(["true", "false"]),
});

/**
 * Actualiza email, nombre, estado y rol de un usuario.
 * Impide que un admin se desactive o se quite permisos a sí mismo (para no
 * quedar fuera del sistema).
 */
export async function updateUserAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<AdminUserView>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado" };

  const parsed = updateUserSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    isActive: String(formData.get("isActive") ?? "true"),
    isAdmin: String(formData.get("isAdmin") ?? "false"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase().trim();
  // Verificar email único (excluyendo al propio usuario).
  const dup = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, id)))
    .limit(1);
  if (dup.length > 0) {
    return {
      ok: false,
      error: "Ya existe otro usuario con ese email",
      fieldErrors: { email: "Email ya registrado" },
    };
  }

  const nextActive = parsed.data.isActive === "true";
  const nextAdmin = parsed.data.isAdmin === "true";

  // Proteger al admin actual de auto-desactivarse o auto-quitar permisos.
  if (id === admin.id && (!nextActive || !nextAdmin)) {
    return {
      ok: false,
      error: "No podés desactivarte ni quitarte permisos de admin a vos mismo.",
    };
  }

  const [updated] = await db
    .update(users)
    .set({
      email,
      name: parsed.data.name.trim(),
      isActive: nextActive,
      isAdmin: nextAdmin,
    })
    .where(eq(users.id, id))
    .returning();

  if (!updated) return { ok: false, error: "Usuario no encontrado" };

  revalidatePath("/admin/users");
  return { ok: true, data: toView(updated) };
}

/**
 * Genera una nueva contraseña temporal, la hashea en la DB y la devuelve
 * en claro para que el admin se la comunique al usuario.
 */
export async function resetUserPasswordAction(
  id: string,
): Promise<ActionResult<{ tempPassword: string }>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado" };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const [updated] = await db
    .update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!updated) return { ok: false, error: "Usuario no encontrado" };

  return { ok: true, data: { tempPassword } };
}

/**
 * Elimina un usuario. Impide el auto-borrado del admin actual.
 */
export async function deleteUserAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado" };

  if (id === admin.id) {
    return { ok: false, error: "No podés eliminar tu propia cuenta." };
  }

  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!deleted) return { ok: false, error: "Usuario no encontrado" };

  revalidatePath("/admin/users");
  return { ok: true, data: undefined };
}
