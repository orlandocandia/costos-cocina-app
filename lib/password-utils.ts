import crypto from "crypto";

/**
 * Genera una contraseña temporal legible de 12 caracteres.
 * Usa solo caracteres seguros sin ambigüedades (sin 0/O, 1/l/I).
 */
export function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

/**
 * Genera un token opaco para recuperación de contraseña.
 */
export function generateResetToken(): string {
  return crypto.randomUUID();
}
