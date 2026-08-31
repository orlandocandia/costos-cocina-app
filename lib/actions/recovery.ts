"use server";

import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateResetToken } from "@/lib/password-utils";
import { sendPasswordRecoveryEmail } from "@/lib/email";
import type { ActionResult } from "./types";
import { zodFieldErrors } from "./types";

/** 15 minutos en segundos. */
const RESET_TTL_SECONDS = 15 * 60;

const requestSchema = z.object({
  email: z.string().email("Email inválido"),
});

/**
 * Genera un token de recuperación y envía el correo si el usuario existe
 * y está activo.
 *
 * Por seguridad, siempre devuelve ok (no revela si el email existe).
 * El enlace se arma con NEXTAUTH_URL (o el origin de la request en el cliente).
 */
export async function requestRecoveryAction(
  formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
  const parsed = requestSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  // Solo enviar si existe Y está activo.
  if (user && user.isActive !== false) {
    const token = generateResetToken();
    const expires = Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS;

    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpires: expires })
      .where(eq(users.id, user.id));

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordRecoveryEmail(user.email, resetUrl);
    } catch (e) {
      console.error("[recovery] error enviando mail:", e);
      // No revelar el fallo al cliente para no filtrar info.
    }
  }

  // Respuesta genérica siempre.
  return {
    ok: true,
    data: { sent: true },
  };
}

const resetSchema = z.object({
  token: z.string().min(1, "Token inválido"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

/**
 * Restablece la contraseña usando un token válido (no expirado).
 * Borra el token después del cambio.
 */
export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.resetToken, parsed.data.token),
      gt(users.resetTokenExpires, now),
    ),
  });

  if (!user) {
    return {
      ok: false,
      error: "El enlace expiró o es inválido. Pedí uno nuevo.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, user.id));

  return { ok: true, data: undefined };
}

