import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsersAction } from "@/lib/actions/admin";
import { AdminUsersView } from "@/components/admin-users-view";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    // El middleware/layout ya filtra, pero por seguridad.
    return <p className="p-6 text-muted-foreground">No autorizado.</p>;
  }
  const res = await getUsersAction();
  const users = res.ok ? res.data : [];
  return <AdminUsersView initialUsers={users} currentUserId={session.user.id} />;
}
