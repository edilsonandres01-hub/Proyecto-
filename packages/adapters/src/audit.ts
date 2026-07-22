export type AuditEntry = {
  at: string;
  adapter: string;
  action: string;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
};

const auditLog: AuditEntry[] = [];

export function recordAudit(
  adapter: string,
  action: string,
  payload: Record<string, unknown>,
  result?: Record<string, unknown>,
): void {
  auditLog.push({
    at: new Date().toISOString(),
    adapter,
    action,
    payload,
    result,
  });
}

/** Returns a copy of the audit log for supervisor tests. */
export function getAuditLog(): readonly AuditEntry[] {
  return [...auditLog];
}

/** Clears the audit log (useful between tests). */
export function clearAuditLog(): void {
  auditLog.length = 0;
}
