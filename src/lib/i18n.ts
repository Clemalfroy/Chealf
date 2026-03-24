import fr from "@/i18n/fr.json";

type Translations = typeof fr;
type Namespace = keyof Translations;
type Key<N extends Namespace> = keyof Translations[N];

export function t<N extends Namespace>(namespace: N, key: Key<N>): string {
  const ns = fr[namespace] as Record<string, string>;
  return ns[key as string] ?? String(key);
}
