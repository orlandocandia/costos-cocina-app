import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validations/auth";

/**
 * Configuración de NextAuth (v4) con CredentialsProvider.
 * La sesión es JWT (necesario para Credentials y para middleware).
 *
 * Validaciones en `authorize`:
 *  - Email + contraseña correctos.
 *  - `isActive === true`: si el admin desactivó al usuario, no puede entrar.
 *  - `isAdmin` se propaga al JWT y a la sesión para proteger /admin.
 */
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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        // Bloquear usuarios desactivados por el administrador.
        if (user.isActive === false) {
          throw new Error("USER_DISABLED");
        }

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
};

// Mensaje de usuario desactivado re-exportado desde auth-messages.ts
// para que los Client Components puedan importarlo sin arrastrar `db`.
export { USER_DISABLED_MESSAGE } from "@/lib/auth-messages";
