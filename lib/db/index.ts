import {
  createClient,
  type Client as LibSQLClient,
} from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Tipo real de la instancia de Drizzle con el schema inyectado.
 * Se usa para tipar el Proxy sin perder `db.query.users`, `db.query.workplaces`, etc.
 */
type DB = ReturnType<typeof buildDb>;

function buildDb(client: LibSQLClient) {
  return drizzle(client, { schema });
}

/**
 * Cliente de Turso (libSQL) con inicialización diferida (lazy).
 *
 * ¿Por qué lazy? Si `TURSO_DATABASE_URL` falta o está vacía en runtime
 * (ej. variables de entorno mal configuradas en Vercel), `createClient`
 * lanza `URL_INVALID` en el module-load y tira abajo TODA la app — incluso
 * rutas que no usan la DB (como `/` que solo redirige, o `/login`).
 *
 * Con lazy init, el cliente se crea recién cuando algo lo usa. Así la app
 * arranca y las rutas públicas siguen funcionando; solo las que realmente
 * consultan la DB fallan, y con un mensaje claro.
 */
let _client: LibSQLClient | null = null;
let _db: DB | null = null;

function getDb(): DB {
  if (_db) return _db;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta la variable de entorno TURSO_DATABASE_URL. " +
        "Configurala en Vercel (Settings → Environment Variables) para Production y Preview.",
    );
  }
  _client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  _db = buildDb(_client);
  return _db;
}

/**
 * `db` es un Proxy transparente: se comporta exactamente como la instancia
 * de Drizzle, pero crea el cliente subyacente en el primer acceso.
 * El tipo `DB` preserva `db.query.users`, `db.query.workplaces`, etc.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
}) as DB;

export { schema };
