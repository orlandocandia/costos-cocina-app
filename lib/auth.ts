import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validations/auth";

/**
 * Logger de autenticación.
 *
 * En Vercel, estos logs aparecen en:
 *   Deployments → (tu deploy) → Logs → Runtime
 *
 * Etiquetas para buscar rápido:
 *   [auth:parse]     — la validación de Zod del input
 *   [auth:lookup]    — la búsqueda del usuario en la DB
 *   [auth:db-error]  — la DB tiró un error (ej. columna is_active faltante)
 *   [auth:compare]   — el resultado de bcrypt.compare
 *   [auth:disabled]  — usuario desactivado
 *   [auth:ok]        — login exitoso
 *   [auth:reject]    — authorize devolvió null (login fallido)
 */
function logAuth(tag: string, data: Record<string, unknown>) {
  // Nunca loguear la contraseña ni el hash completo.
  console.log(`[auth:${tag}]`, JSON.stringify(data));
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // 1) Validar el input.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          logAuth("parse", {
            ok: false,
            issues: parsed.error.issues.map((i) => i.message),
          });
          return null;
        }

        const email = parsed.data.email.toLowerCase().trim();
        logAuth("parse", { ok: true, email });

        // 2) Buscar el usuario en la DB. Si la query falla (ej. la tabla no
        //    tiene las columnas is_active/is_admin porque no se migró el
        //    schema), lo capturamos y logueamos con detalle — sino NextAuth
        //    traga el error y devuelve "credenciales incorrectas".
        let user;
        try {
          user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
        } catch (err) {
          logAuth("db-error", {
            email,
            message: err instanceof Error ? err.message : String(err),
            name: err instanceof Error ? err.name : "Unknown",
          });
          // Relanzar para que NextAuth lo registre como error de servidor
          // en vez de "credenciales incorrectas".
          throw new Error(
            "Error de base de datos al buscar el usuario. " +
              "¿Migraste el schema con `npx drizzle-kit push`? " +
              "Revisá los logs del servidor.",
          );
        }

        logAuth("lookup", {
          email,
          found: !!user,
          userId: user?.id ?? null,
          isActive: user?.isActive ?? null,
          isAdmin: user?.isAdmin ?? null,
          hashPrefix: user?.passwordHash?.slice(0, 10) ?? null,
        });

        if (!user) {
          logAuth("reject", { email, reason: "user-not-found" });
          return null;
        }

        // 3) Comparar la contraseña con el hash.
        let valid = false;
        try {
          valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        } catch (err) {
          logAuth("db-error", {
            email,
            stage: "bcrypt.compare",
            message: err instanceof Error ? err.message : String(err),
            hashPrefix: user.passwordHash?.slice(0, 10),
          });
          return null;
        }

        logAuth("compare", {
          email,
          valid,
          hashPrefix: user.passwordHash?.slice(0, 10),
        });

        if (!valid) {
          logAuth("reject", { email, reason: "wrong-password" });
          return null;
        }

        // 4) Bloquear usuarios desactivados.
        if (user.isActive === false) {
          logAuth("disabled", { email, userId: user.id });
          throw new Error("USER_DISABLED");
        }

        logAuth("ok", { email, userId: user.id, isAdmin: user.isAdmin });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },
  // Hacer que los errores del authorize se vean en los logs de Vercel.
  logger: {
    error(code, message) {
      console.error("[next-auth][error]", code, message);
    },
    warn(code) {
      console.warn("[next-auth][warn]", code);
    },
    debug() {},
  },
};

// Mensaje de usuario desactivado re-exportado desde auth-messages.ts
// para que los Client Components puedan importarlo sin arrastrar `db`.
export { USER_DISABLED_MESSAGE } from "@/lib/auth-messages";
