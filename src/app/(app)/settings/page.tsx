import { verifySession } from "@/lib/dal";
import { getMemoryFacts } from "@/lib/memory/service";
import { getGuidelines } from "@/lib/guidelines/service";
import { MemoryFactsList } from "@/components/settings/memory-facts-list";
import { GuidelinesList } from "@/components/settings/guidelines-list";

export default async function SettingsPage() {
  const { user } = await verifySession();

  const [facts, guidelines] = await Promise.all([
    getMemoryFacts(user.id),
    getGuidelines(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gère la mémoire de l&apos;IA et tes guidelines de génération.
        </p>
      </div>

      {/* AI Memory */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Mémoire IA
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Faits que l&apos;assistant a mémorisés sur toi au fil des conversations.
            Ces informations sont injectées dans chaque conversation.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <MemoryFactsList facts={facts} />
        </div>
      </section>

      {/* User Guidelines */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Guidelines
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Directives personnalisées injectées dans chaque conversation IA.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <GuidelinesList guidelines={guidelines} />
        </div>
      </section>
    </div>
  );
}
