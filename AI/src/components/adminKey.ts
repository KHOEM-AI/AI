const K = "khoem-api-key";

export function getAdminKey(promptText: string): string | null {
  let k = sessionStorage.getItem(K);
  if (!k) {
    k = window.prompt(promptText);
    if (k) sessionStorage.setItem(K, k.trim());
  }
  return k ? k.trim() : null;
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(K);
}
