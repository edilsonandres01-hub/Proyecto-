export const FEATURE_FLAG_KEYS = [
  'billing',
  'referrals',
  'analytics',
  'accountantPortal',
  'csvImport',
  'webhooks',
  'notifications',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  billing: true,
  referrals: true,
  analytics: true,
  accountantPortal: true,
  csvImport: true,
  webhooks: true,
  notifications: true,
};

function isFlagKey(value: string): value is FeatureFlagKey {
  return (FEATURE_FLAG_KEYS as readonly string[]).includes(value);
}

/**
 * Resolve feature flags.
 * - Defaults: all true
 * - `PYMEBOT_FLAGS` as JSON object overrides keys, e.g. `{"billing":false}`
 * - Or comma-separated **disabled** list, e.g. `billing,webhooks`
 */
export function resolveFeatureFlags(rawEnv: string | undefined | null = process.env.PYMEBOT_FLAGS): FeatureFlags {
  const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  if (!rawEnv || !rawEnv.trim()) return flags;

  const trimmed = rawEnv.trim();

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      for (const key of FEATURE_FLAG_KEYS) {
        if (typeof parsed[key] === 'boolean') {
          flags[key] = parsed[key];
        }
      }
      return flags;
    } catch {
      // fall through to comma list parsing
    }
  }

  for (const part of trimmed.split(',')) {
    const key = part.trim();
    if (isFlagKey(key)) {
      flags[key] = false;
    }
  }

  return flags;
}

/** Alias used by ops/health and Lead dashboards. */
export function getFeatureFlags(rawEnv?: string | null): FeatureFlags {
  return resolveFeatureFlags(rawEnv);
}
