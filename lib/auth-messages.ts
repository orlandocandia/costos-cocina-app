/**
 * Mensajes de error de autenticación para usar tanto en server como en client.
 *
 * Mantenido en un archivo aparte (sin imports de `db`, `bcrypt`, etc.) para
 * que los Client Components puedan importarlo sin arrastrar dependencias
 * de servidor al bundle del navegador.
 */
export const USER_DISABLED_MESSAGE =
  "Usuario desactivado. Contactá al administrador.";

export const INVALID_CREDENTIALS_MESSAGE =
  "Email o contraseña incorrectos.";
