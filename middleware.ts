import withAuth, { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Protege:
 *  - /dashboard/*  → cualquier usuario autenticado.
 *  - /admin/*      → solo usuarios con isAdmin === true.
 *
 * Si un usuario no-admin intenta entrar a /admin/*, recibe 403.
 */
export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && !token?.isAdmin) {
      // No es admin: prohibido.
      return new NextResponse("Forbidden: se requieren permisos de administrador", {
        status: 403,
      });
    }
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
