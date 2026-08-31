"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validations/auth";
import type { ActionResult } from "./types";
import { zodFieldErrors } from "./types";

/**
 * Crea un usuario nuevo. No inicia sesión acá: el cliente debe llamar a
 * `signIn("credentials", ...)` de next-auth/react después de un registro
 * exitoso (ver app/register/page.tsx).
 */
export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<{ name: string; email: string }>> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
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
      error: "Ya existe una cuenta con ese email",
      fieldErrors: { email: "Email ya registrado" },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(users)
    .values({
      name: parsed.data.name.trim(),
      email,
      passwordHash,
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  return {
    ok: true,
    data: { name: created.name ?? "", email: created.email },
  };
}
