const auditLog = [];
export function recordAudit(adapter, action, payload, result) {
    auditLog.push({
        at: new Date().toISOString(),
        adapter,
        action,
        payload,
        result,
    });
}
/** Returns a copy of the audit log for supervisor tests. */
export function getAuditLog() {
    return [...auditLog];
}
/** Clears the audit log (useful between tests). */
export function clearAuditLog() {
    auditLog.length = 0;
}
//# sourceMappingURL=audit.js.map