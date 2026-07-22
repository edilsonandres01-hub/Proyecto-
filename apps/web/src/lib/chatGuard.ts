type Bucket = { count: number; windowStart: number };
type IdemEntry = { body: unknown; expiresAt: number };

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const IDEMPOTENCY_TTL_MS = 5 * 60_000;

const rateBuckets = new Map<string, Bucket>();
const idempotencyStore = new Map<string, IdemEntry>();

function pruneIdempotency(now: number) {
  for (const [key, entry] of idempotencyStore) {
    if (entry.expiresAt <= now) idempotencyStore.delete(key);
  }
}

/** Returns true if the request is allowed; false if rate-limited. */
export function checkChatRateLimit(tenantId: string, now = Date.now()): boolean {
  const bucket = rateBuckets.get(tenantId);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(tenantId, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export function getIdempotentResponse(key: string, now = Date.now()): unknown | undefined {
  pruneIdempotency(now);
  const entry = idempotencyStore.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    idempotencyStore.delete(key);
    return undefined;
  }
  return entry.body;
}

export function storeIdempotentResponse(key: string, body: unknown, now = Date.now()) {
  pruneIdempotency(now);
  idempotencyStore.set(key, { body, expiresAt: now + IDEMPOTENCY_TTL_MS });
}

/** Test helpers */
export function __resetChatGuards() {
  rateBuckets.clear();
  idempotencyStore.clear();
}
