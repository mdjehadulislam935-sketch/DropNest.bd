import type { AuditRecord, UserAccount, UserRole } from '../types/platform.ts';
import type { UserVerificationAuditEntry, UserVerificationItem } from '../types/admin.ts';

export interface ApprovalTransitionOptions {
  application: UserVerificationItem;
  previousStatus: string;
  newStatus: 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'UNDER_REVIEW';
  actor: UserAccount;
  reason?: string;
  ipAddress?: string;
}

export interface ApprovalTransitionResult {
  auditEntry: UserVerificationAuditEntry;
  systemAuditRecord: AuditRecord;
}

/**
 * Server-side AuditLogManager
 * Authoritative service responsible for tracking state changes in the approval workflow,
 * guaranteeing immutable recording of timestamp, actor role, actor identity, and previous status.
 */
export class AuditLogManager {
  /**
   * Records a transition in the approval workflow.
   * Ensures that previousStatus, newStatus, timestamp, and actor role are preserved.
   */
  public static recordApprovalStateChange(
    options: ApprovalTransitionOptions
  ): ApprovalTransitionResult {
    const { application, previousStatus, newStatus, actor, reason, ipAddress } = options;
    const now = new Date();
    const timestamp = now.toISOString();
    const entryId = `aud_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`;

    // Build the application-level compliance audit entry
    const auditEntry: UserVerificationAuditEntry = {
      id: entryId,
      action: newStatus,
      previousStatus: previousStatus || 'UNKNOWN',
      newStatus: newStatus,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      notes: reason?.trim()
        ? reason.trim()
        : newStatus === 'APPROVED'
        ? `Status transitioned from ${previousStatus} to APPROVED. Active platform credentials granted.`
        : `Status transitioned from ${previousStatus} to ${newStatus}.`,
      ipAddress: ipAddress || '127.0.0.1 (Internal System)',
    };

    // Build the platform-wide audit log entry
    const details = `[Workflow Transition: ${previousStatus} → ${newStatus}] ${application.role} application #${application.id} for "${application.fullName}" (${application.businessName || 'Independent'}, Mobile: ${application.mobile}) reviewed by ${actor.fullName} (${actor.role}). ${
      reason ? `Reason: "${reason.trim()}"` : 'Clearance granted.'
    }`;

    const systemAuditRecord: AuditRecord = {
      id: `SYS-AUD-${now.getTime()}-${Math.floor(100 + Math.random() * 900)}`,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role as UserRole,
      action: `USER_VERIFICATION_${newStatus}`,
      details,
      timestamp,
      ipAddress: ipAddress || '127.0.0.1',
    };

    return { auditEntry, systemAuditRecord };
  }

  /**
   * Helper to format human-readable transition summary
   */
  public static formatTransitionSummary(entry: UserVerificationAuditEntry): string {
    const prev = entry.previousStatus || 'INIT';
    const curr = entry.newStatus || entry.action;
    return `[${prev} → ${curr}] by ${entry.actorName} (${entry.actorRole}) at ${entry.timestamp}`;
  }
}
