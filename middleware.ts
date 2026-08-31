import withAuth from "next-auth/middleware";

/**
 * Protege todas las rutas bajo /dashboard. Si no hay sesión válida,
 * redirige a /login (definido en authOptions.pages.signIn).
 */
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
