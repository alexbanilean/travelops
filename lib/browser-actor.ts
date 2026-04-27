const STORAGE_KEY = "travelops_actor_name";
const MAX_LEN = 120;

export function getActorNameFromStorage(): string {
  if (typeof window === "undefined") return "Guest";
  const v = window.localStorage.getItem(STORAGE_KEY)?.trim();
  if (!v) return "Guest";
  return v.slice(0, MAX_LEN);
}

export function setActorNameInStorage(name: string): void {
  if (typeof window === "undefined") return;
  const t = name.trim().slice(0, MAX_LEN);
  if (t) window.localStorage.setItem(STORAGE_KEY, t);
  else window.localStorage.removeItem(STORAGE_KEY);
}

/** Merge into fetch / Request headers from client components. */
export function actorHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const name = getActorNameFromStorage();
  return { "x-travelops-actor": name };
}
