export type AuditEntry = {
    at: string;
    adapter: string;
    action: string;
    payload: Record<string, unknown>;
    result?: Record<string, unknown>;
};
export declare function recordAudit(adapter: string, action: string, payload: Record<string, unknown>, result?: Record<string, unknown>): void;
/** Returns a copy of the audit log for supervisor tests. */
export declare function getAuditLog(): readonly AuditEntry[];
/** Clears the audit log (useful between tests). */
export declare function clearAuditLog(): void;
//# sourceMappingURL=audit.d.ts.map