import type { AuditLog } from '../types';

function metadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = metadata?.[key];
  if (typeof v === 'string' && v.trim() !== '') {
    return v;
  }
  if (v != null && typeof v !== 'object') {
    return String(v);
  }
  return undefined;
}

/** Label for who performed an audit event (matches backend + proxy field shapes). */
export function auditActorDisplayName(log: AuditLog): string {
  return (
    log.userDisplayName ||
    log.userEmail ||
    log.user?.email ||
    metadataString(log.metadata, 'userName') ||
    metadataString(log.metadata, 'userEmail') ||
    'Unknown'
  );
}
