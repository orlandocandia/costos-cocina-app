/**
 * scripts/seed-admin.ts
 *
 * Crea o actualiza el usuario administrador inicial en Turso.
 *
 * Uso (desde la raíz del proyecto, con .env.local configurado):
 *   npx tsx scripts/seed-admin.ts
 *
 * El script lee automáticamente .env.local (sin deps extra).
 * También podés pasar las vars inline:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/seed-admin.ts
 *
 * El script es idempotente: puede ejecutarse varias veces sin daño.
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ADMIN_EMAIL = "admin@costos-cocina.com";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_NAME = "Administrador";
const ADMIN_ID = "admin"; // id estable y predecible

/**
 * Carga pares KEY=VALUE desde .env.local en process.env (sin sobrescribir
 * las que ya estén definidas en el entorno).
 */
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Quitar comillas envolventes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error(
      "\n❌ Falta TURSO_DATABASE_URL.\n" +
        "   Configurala en .env.local o pasala como variable de entorno:\n" +
        "   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/seed-admin.ts\n",
    );
    process.exit(1);
  }

  console.log("🔌 Conectando a Turso...");
  const safeUrl = url.replace(/:[^@]+@/, ":***@");
  console.log(`   URL: ${safeUrl}`);
  const client = createClient({ url, authToken });

  // 1) Verificar que las columnas admin existan (si el schema no se migró, guiar).
  try {
    await client.execute("SELECT is_active, is_admin FROM users LIMIT 1");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/no such column|no column named/i.test(msg)) {
      console.error(
        "\n❌ Las columnas is_active / is_admin NO existen en la tabla users.\n" +
          "   Ejecutá primero la migración del schema:\n\n" +
          "       npx drizzle-kit push\n\n" +
          "   y luego volvé a correr este script.\n",
      );
      process.exit(1);
    }
    console.warn("⚠️  Aviso al verificar columnas:", msg);
  }

  // 2) Generar el hash de la contraseña.
  console.log("🔐 Generando hash bcrypt...");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 3) Verificar si el admin ya existe (por id o por email).
  const existing = await client.execute({
    sql: "SELECT id, email FROM users WHERE id = ? OR email = ?",
    args: [ADMIN_ID, ADMIN_EMAIL],
  });

  if (existing.rows.length > 0) {
    console.log("ℹ️  El admin ya existe. Actualizando contraseña y permisos...");
    await client.execute({
      sql: "UPDATE users SET password_hash = ?, name = ?, is_active = 1, is_admin = 1, reset_token = NULL, reset_token_expires = NULL WHERE id = ? OR email = ?",
      args: [passwordHash, ADMIN_NAME, ADMIN_ID, ADMIN_EMAIL],
    });
    console.log("✅ Admin actualizado.");
  } else {
    console.log("👤 Creando usuario administrador...");
    await client.execute({
      sql: "INSERT INTO users (id, email, password_hash, name, is_active, is_admin, created_at) VALUES (?, ?, ?, ?, 1, 1, unixepoch())",
      args: [ADMIN_ID, ADMIN_EMAIL, passwordHash, ADMIN_NAME],
    });
    console.log("✅ Admin creado.");
  }

  // 4) Verificar.
  const check = await client.execute({
    sql: "SELECT id, email, name, is_active, is_admin FROM users WHERE id = ? OR email = ?",
    args: [ADMIN_ID, ADMIN_EMAIL],
  });
  const row = check.rows[0] as
    | Record<string, unknown>
    | undefined;
  console.log("\n📋 Usuario en la base:");
  console.log("   id:        ", row?.["id"]);
  console.log("   email:     ", row?.["email"]);
  console.log("   name:      ", row?.["name"]);
  console.log(
    "   is_active: ",
    Number(row?.["is_active"]) === 1 ? "true" : "false",
  );
  console.log(
    "   is_admin:  ",
    Number(row?.["is_admin"]) === 1 ? "true" : "false",
  );

  console.log("\n🔑 CREDENCIALES DE ACCESO:");
  console.log("   Email:      " + ADMIN_EMAIL);
  console.log("   Contraseña: " + ADMIN_PASSWORD);
  console.log(
    "\n   ➡️  Ingresá en /login. Después del login irás a /dashboard.",
  );
  console.log(
    '   ➡️  Desde el sidebar verás "Admin · Usuarios" para gestionar el resto.\n',
  );
}

main().catch((e) => {
  console.error("\n💥 Error inesperado:");
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
