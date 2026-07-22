export function resolveWebhookStatus(payload) {
    if (payload &&
        typeof payload === 'object' &&
        'status' in payload &&
        payload.status === 'failed') {
        return 'failed';
    }
    return 'paid';
}
export function resolveIntentId(payload, fallback) {
    if (payload &&
        typeof payload === 'object' &&
        'intentId' in payload &&
        typeof payload.intentId === 'string') {
        return payload.intentId;
    }
    return fallback;
}
//# sourceMappingURL=webhookHelpers.js.map