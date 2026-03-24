import { verifySession } from "@/lib/dal";

export default async function Home() {
  const { user } = await verifySession();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">
        Bonjour 👋
      </h1>
      <p className="mt-2 text-muted-foreground">
        Connecté en tant que {user.email}
      </p>
    </div>
  );
}
