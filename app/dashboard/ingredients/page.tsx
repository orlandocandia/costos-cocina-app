import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ingredients } from "@/lib/db/schema";
import { IngredientsView } from "@/components/ingredients-view";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const session = await getServerSession(authOptions);
  const items = session?.user?.id
    ? await db.query.ingredients.findMany({
        where: eq(ingredients.userId, session.user.id),
        orderBy: (ingredients, { asc }) => [asc(ingredients.name)],
      })
    : [];

  return <IngredientsView initialIngredients={items} />;
}
