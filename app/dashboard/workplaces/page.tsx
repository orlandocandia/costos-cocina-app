import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workplaces } from "@/lib/db/schema";
import { WorkplacesView } from "@/components/workplaces-view";

export const dynamic = "force-dynamic";

export default async function WorkplacesPage() {
  const session = await getServerSession(authOptions);
  const items = session?.user?.id
    ? await db.query.workplaces.findMany({
        where: eq(workplaces.userId, session.user.id),
        orderBy: (workplaces, { desc }) => [desc(workplaces.createdAt)],
      })
    : [];

  return <WorkplacesView initialWorkplaces={items} />;
}
