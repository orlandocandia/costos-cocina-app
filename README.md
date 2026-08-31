# Costos de Cocina

Sistema de gestión de **lugares de trabajo** y **insumos** (despensa) con autenticación de usuarios.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **Drizzle ORM** con **Turso (libSQL)**
- **NextAuth.js v4** (CredentialsProvider, sesión JWT)
- **bcryptjs** para hashear contraseñas
- **Zod** para validaciones
- **Server Actions** para mutaciones

## Estructura

```
app/
  api/auth/[...nextauth]/route.ts   # Handler de NextAuth
  login/page.tsx                     # Pantalla de login
  register/page.tsx                  # Pantalla de registro
  dashboard/
    layout.tsx                       # Protege rutas + sidebar
    page.tsx                         # Resumen (KPIs)
    workplaces/page.tsx              # ABM Lugares de trabajo
    ingredients/page.tsx             # ABM Insumos (con búsqueda)
  layout.tsx                         # Root layout + SessionProvider
  page.tsx                           # Redirige a /dashboard o /login
components/                          # UI (sidebar, modales, views)
lib/
  db/schema.ts                       # Esquema Drizzle (users, workplaces, ingredients)
  db/index.ts                        # Cliente Turso (libSQL)
  auth.ts                            # Config NextAuth
  validations/                       # Schemas Zod
  actions/                           # Server Actions (auth, workplace, ingredient)
middleware.ts                        # Protege /dashboard/*
drizzle.config.ts                    # Config de drizzle-kit
types/next-auth.d.ts                 # Extiende tipos de NextAuth (user.id)
```

## Variables de entorno (en Vercel y .env.local)

```
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tu-dominio.vercel.app
TURSO_DATABASE_URL=libsql://costos-cocina-xxxx.turso.io
TURSO_AUTH_TOKEN=...
```

## Desarrollo local

```bash
npm install
npx drizzle-kit push     # crea las tablas en Turso
npm run dev
```
