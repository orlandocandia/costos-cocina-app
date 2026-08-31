import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware que protege las rutas del sistema.
 * - /login, /recovery, /reset-password: acceso público (sin sesión)
 * - /dashboard/*: requiere sesión activa
 * - /admin/*: requiere sesión activa y rol de administrador
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Rutas públicas (no requieren autenticación)
    const publicPaths = ["/login", "/recovery", "/reset-password"];
    if (publicPaths.includes(path)) {
      // Si ya tiene sesión, redirigir al dashboard
      if (token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // Si no hay token, redirigir a login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Para /admin/*, verificar que sea administrador
    if (path.startsWith("/admin")) {
      if (!token.isAdmin) {
        // Si no es admin, devolver 403 o redirigir
        return new NextResponse("Acceso denegado", { status: 403 });
      }
      return NextResponse.next();
    }

    // Para /dashboard/*, solo requiere token (ya verificado)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Esta función se ejecuta antes del middleware
        // Devolvemos true para que el middleware maneje la lógica
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/recovery",
    "/reset-password",
  ],
};
