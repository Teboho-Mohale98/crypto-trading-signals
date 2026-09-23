interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const store = new Map<string, CacheEntry>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const value = await loader();
  store.set(key, { expiresAt: Date.now() + ttlMs, value });
  return value;
}

export function clearCache(): void {
  store.clear();
}