import type { AuditLog } from '../types';

/** True when a description still embeds a raw UUID (treat as not user-facing). */
export function auditDescriptionContainsUuid(description: string): boolean {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  return uuidPattern.test(description);
}

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
