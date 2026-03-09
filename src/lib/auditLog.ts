// Manajel Store - Audit Logging Utility
// Tracks security-relevant events for monitoring and compliance

interface AuditLogEntry {
  action: string;
  userId?: string;
  email?: string;
  orderId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

const logs: Array<AuditLogEntry & { timestamp: Date }> = [];

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  const logEntry = {
    ...entry,
    timestamp: new Date(),
  };

  logs.push(logEntry);

  console.log(
    `[AUDIT] ${logEntry.action} | User: ${entry.userId || entry.email || "guest"} | ${
      entry.reason || ""
    }`
  );

  if (logs.length > 1000) {
    logs.shift();
  }
}

export function getAuditLogs(filter?: {
  action?: string;
  userId?: string;
  email?: string;
  limit?: number;
}): Array<AuditLogEntry & { timestamp: Date }> {
  let filtered = [...logs];

  if (filter?.action) {
    filtered = filtered.filter((log) => log.action === filter.action);
  }

  if (filter?.userId) {
    filtered = filtered.filter((log) => log.userId === filter.userId);
  }

  if (filter?.email) {
    filtered = filtered.filter((log) => log.email === filter.email);
  }

  const limit = filter?.limit || 100;
  return filtered.slice(-limit).reverse();
}

export function getFailedLoginAttempts(email: string, windowMinutes = 15): number {
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
  return logs.filter(
    (log) =>
      log.action === "LOGIN_FAILED" &&
      log.email === email &&
      log.timestamp >= cutoff
  ).length;
}
