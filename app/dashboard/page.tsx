import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { workplaces, ingredients } from "@/lib/db/schema";
import { OverviewView } from "@/components/overview-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [wpList, ingList] = userId
    ? await Promise.all([
        db.query.workplaces.findMany({
          where: eq(workplaces.userId, userId),
          orderBy: (workplaces, { desc }) => [desc(workplaces.createdAt)],
        }),
        db.query.ingredients.findMany({
          where: eq(ingredients.userId, userId),
          orderBy: (ingredients, { desc }) => [desc(ingredients.createdAt)],
        }),
      ])
    : [[], []];

  return <OverviewView workplaces={wpList} ingredients={ingList} />;
}
