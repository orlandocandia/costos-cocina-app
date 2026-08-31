import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy para Next.js 16.
 * Reemplaza el middleware obsoleto con la nueva convención.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rutas públicas (no requieren autenticación)
  const publicPaths = ["/login", "/recovery", "/reset-password"];
  if (publicPaths.includes(path)) {
    // Si ya tiene sesión, redirigir al dashboard
    const token = await getToken({ req: request });
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Obtener el token de la sesión
  const token = await getToken({ req: request });

  // Si no hay token y la ruta es protegida, redirigir a login
  if (!token) {
    if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Para /admin/*, verificar que sea administrador
  if (path.startsWith("/admin")) {
    if (!token.isAdmin) {
      return new NextResponse("Acceso denegado", { status: 403 });
    }
    return NextResponse.next();
  }

  // Para /dashboard/*, solo requiere token (ya verificado)
  if (path.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configuración de las rutas que el proxy intercepta
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/recovery",
    "/reset-password",
  ],
};
