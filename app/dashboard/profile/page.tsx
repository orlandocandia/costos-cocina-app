import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileView } from "@/components/profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  return (
    <ProfileView
      initialName={session?.user?.name ?? ""}
      email={session?.user?.email ?? ""}
    />
  );
}
