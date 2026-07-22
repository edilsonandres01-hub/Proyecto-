export function resolveWebhookStatus(payload: unknown): 'paid' | 'failed' {
  if (
    payload &&
    typeof payload === 'object' &&
    'status' in payload &&
    (payload as { status: unknown }).status === 'failed'
  ) {
    return 'failed';
  }
  return 'paid';
}

export function resolveIntentId(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'intentId' in payload &&
    typeof (payload as { intentId: unknown }).intentId === 'string'
  ) {
    return (payload as { intentId: string }).intentId;
  }
  return fallback;
}
