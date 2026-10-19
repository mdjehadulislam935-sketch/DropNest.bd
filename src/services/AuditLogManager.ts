import type { UserVerificationAuditEntry, UserVerificationItem } from '../types/admin.ts';
import type { AuditRecord, UserRole } from '../types/platform.ts';

export interface AuditTransitionFilterCriteria {
  searchQuery?: string;
  roleFilter?: string;
  statusFilter?: string;
  actorRoleFilter?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransitionMetricSummary {
  totalTransitions: number;
  approvedCount: number;
  rejectedCount: number;
  underReviewCount: number;
  blockedCount: number;
  byActorRole: Record<string, number>;
  latestTransitionTimestamp?: string;
}

/**
 * Frontend AuditLogManager Service
 * Provides centralized tracking, formatting, filtering, and statistical analysis
 * of all approval workflow transitions across Reseller and Supplier registration requests.
 */
export class AuditLogManager {
  /**
   * Formats a state transition badge label (e.g. "PENDING → APPROVED")
   */
  public static formatTransitionArrow(
    previousStatus?: string,
    newStatus?: string
  ): {
    from: string;
    to: string;
    arrowText: string;
    isApproval: boolean;
    isRejection: boolean;
  } {
    const from = previousStatus ? previousStatus.replace('_', ' ') : 'SUBMITTED';
    const to = newStatus ? newStatus.replace('_', ' ') : 'PENDING';
    const isApproval = to.toUpperCase() === 'APPROVED';
    const isRejection = to.toUpperCase() === 'REJECTED';

    return {
      from,
      to,
      arrowText: `${from} → ${to}`,
      isApproval,
      isRejection,
    };
  }

  /**
   * Extracts all state change audit entries from an application list
   */
  public static extractAllApprovalAudits(
    applications: UserVerificationItem[]
  ): Array<UserVerificationAuditEntry & { applicationId: string; applicantName: string; applicantRole: string }> {
    const allAudits: Array<
      UserVerificationAuditEntry & { applicationId: string; applicantName: string; applicantRole: string }
    > = [];

    for (const app of applications) {
      if (app.auditTrail && app.auditTrail.length > 0) {
        for (const entry of app.auditTrail) {
          allAudits.push({
            ...entry,
            applicationId: app.id,
            applicantName: app.fullName,
            applicantRole: app.role,
          });
        }
      }
    }

    // Sort chronologically descending (newest first)
    return allAudits.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Filters audit logs based on specified criteria
   */
  public static filterAudits<T extends UserVerificationAuditEntry & { applicantName?: string; applicantRole?: string }>(
    logs: T[],
    criteria: AuditTransitionFilterCriteria
  ): T[] {
    return logs.filter((log) => {
      // Role filter
      if (criteria.roleFilter && criteria.roleFilter !== 'ALL') {
        if (log.applicantRole && log.applicantRole !== criteria.roleFilter) return false;
      }

      // Status/Action filter
      if (criteria.statusFilter && criteria.statusFilter !== 'ALL') {
        const actionMatch = log.action === criteria.statusFilter || log.newStatus === criteria.statusFilter;
        if (!actionMatch) return false;
      }

      // Actor Role filter
      if (criteria.actorRoleFilter && criteria.actorRoleFilter !== 'ALL') {
        if (log.actorRole !== criteria.actorRoleFilter) return false;
      }

      // Search Query
      if (criteria.searchQuery && criteria.searchQuery.trim()) {
        const query = criteria.searchQuery.toLowerCase().trim();
        const matchActor = log.actorName.toLowerCase().includes(query);
        const matchRole = log.actorRole.toLowerCase().includes(query);
        const matchNotes = log.notes?.toLowerCase().includes(query) || false;
        const matchApplicant = log.applicantName?.toLowerCase().includes(query) || false;
        const matchPrev = log.previousStatus?.toLowerCase().includes(query) || false;
        const matchNew = (log.newStatus || log.action).toLowerCase().includes(query);

        if (!matchActor && !matchRole && !matchNotes && !matchApplicant && !matchPrev && !matchNew) {
          return false;
        }
      }

      // Date Range Filter
      if (criteria.startDate) {
        if (new Date(log.timestamp) < new Date(criteria.startDate)) return false;
      }
      if (criteria.endDate) {
        if (new Date(log.timestamp) > new Date(criteria.endDate)) return false;
      }

      return true;
    });
  }

  /**
   * Computes compliance metrics across approval workflow transitions
   */
  public static computeMetrics(entries: UserVerificationAuditEntry[]): TransitionMetricSummary {
    const summary: TransitionMetricSummary = {
      totalTransitions: entries.length,
      approvedCount: 0,
      rejectedCount: 0,
      underReviewCount: 0,
      blockedCount: 0,
      byActorRole: {},
      latestTransitionTimestamp: entries[0]?.timestamp,
    };

    for (const e of entries) {
      const action = (e.newStatus || e.action).toUpperCase();
      if (action === 'APPROVED') summary.approvedCount++;
      else if (action === 'REJECTED') summary.rejectedCount++;
      else if (action === 'UNDER_REVIEW') summary.underReviewCount++;
      else if (action === 'BLOCKED') summary.blockedCount++;

      const role = e.actorRole || 'UNKNOWN';
      summary.byActorRole[role] = (summary.byActorRole[role] || 0) + 1;
    }

    return summary;
  }

  /**
   * Generates a downloadable CSV string of approval workflow transitions
   */
  public static exportToCsv(
    entries: Array<UserVerificationAuditEntry & { applicationId?: string; applicantName?: string }>
  ): string {
    const headers = [
      'Timestamp (UTC)',
      'Application ID',
      'Applicant Name',
      'Previous Status',
      'New Status / Action',
      'Actor Name',
      'Actor Role',
      'Notes & Justification',
    ];

    const rows = entries.map((entry) => [
      `"${entry.timestamp}"`,
      `"${entry.applicationId || 'N/A'}"`,
      `"${entry.applicantName || 'N/A'}"`,
      `"${entry.previousStatus || 'N/A'}"`,
      `"${entry.newStatus || entry.action}"`,
      `"${entry.actorName}"`,
      `"${entry.actorRole}"`,
      `"${(entry.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
