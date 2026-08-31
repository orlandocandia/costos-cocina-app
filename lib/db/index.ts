import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Cliente de Turso (libSQL).
 * Requiere las variables de entorno:
 *   - TURSO_DATABASE_URL  (ej. libsql://costos-cocina-xxxx.turso.io)
 *   - TURSO_AUTH_TOKEN    (token de la base de datos)
 */
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
