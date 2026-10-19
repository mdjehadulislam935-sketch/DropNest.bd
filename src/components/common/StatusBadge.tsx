import React from 'react';
import {
  AlertCircle,
  AlertOctagon,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  PauseCircle,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';

export type RegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_REVIEW'
  | 'BLOCKED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ON_HOLD'
  | string;

export interface StatusBadgeProps {
  /** The status string to display */
  status: RegistrationStatus;
  /** Visual density size of the badge */
  size?: 'xs' | 'sm' | 'md';
  /** Optional icon rendered adjacent to the text label */
  showIcon?: boolean;
  /** Add a subtle pulse effect for pending/in-progress states */
  withPulse?: boolean;
  /** Optional custom text label overriding the default humanized title */
  label?: string;
  /** Additional custom Tailwind class names */
  className?: string;
}

interface StatusConfig {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPulse?: boolean;
}

/**
 * Normalizes input status strings (e.g. "under_review", "PENDING", "UNDER REVIEW")
 */
function normalizeStatus(status: string): string {
  return (status || '').toUpperCase().replace(/[\s-]+/g, '_');
}

/**
 * Color tokens mapped directly to our CSS custom properties defined in index.css:
 * --status-success: #34D399
 * --status-warning: #FBBF24
 * --status-error: #F87171
 * --cyan-accent: #22D3EE
 * --secondary-purple: #A855F7
 * --border-color: #302741
 * --text-secondary: #C9C4D6
 */
const STATUS_CONFIGS: Record<string, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    textColor: 'text-[var(--status-warning,#FBBF24)]',
    bgColor: 'bg-[var(--status-warning,#FBBF24)]/15',
    borderColor: 'border-[var(--status-warning,#FBBF24)]/40',
    icon: Clock,
    defaultPulse: true,
  },
  APPROVED: {
    label: 'Approved',
    textColor: 'text-[var(--status-success,#34D399)]',
    bgColor: 'bg-[var(--status-success,#34D399)]/15',
    borderColor: 'border-[var(--status-success,#34D399)]/35',
    icon: Check,
    defaultPulse: false,
  },
  REJECTED: {
    label: 'Rejected',
    textColor: 'text-[var(--status-error,#F87171)]',
    bgColor: 'bg-[var(--status-error,#F87171)]/15',
    borderColor: 'border-[var(--status-error,#F87171)]/35',
    icon: X,
    defaultPulse: false,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    textColor: 'text-[var(--cyan-accent,#22D3EE)]',
    bgColor: 'bg-[var(--cyan-accent,#22D3EE)]/15',
    borderColor: 'border-[var(--cyan-accent,#22D3EE)]/35',
    icon: Eye,
    defaultPulse: false,
  },
  BLOCKED: {
    label: 'Blocked',
    textColor: 'text-[#EF4444]',
    bgColor: 'bg-[#EF4444]/20',
    borderColor: 'border-[#EF4444]/40',
    icon: Ban,
    defaultPulse: false,
  },
  ACTIVE: {
    label: 'Active',
    textColor: 'text-[var(--status-success,#34D399)]',
    bgColor: 'bg-[var(--status-success,#34D399)]/15',
    borderColor: 'border-[var(--status-success,#34D399)]/35',
    icon: CheckCircle2,
    defaultPulse: false,
  },
  SUSPENDED: {
    label: 'Suspended',
    textColor: 'text-[var(--status-error,#F87171)]',
    bgColor: 'bg-[var(--status-error,#F87171)]/15',
    borderColor: 'border-[var(--status-error,#F87171)]/35',
    icon: AlertOctagon,
    defaultPulse: false,
  },
  ON_HOLD: {
    label: 'On Hold',
    textColor: 'text-[var(--status-warning,#FBBF24)]',
    bgColor: 'bg-[var(--status-warning,#FBBF24)]/15',
    borderColor: 'border-[var(--status-warning,#FBBF24)]/35',
    icon: PauseCircle,
    defaultPulse: false,
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: 'Unknown',
  textColor: 'text-[var(--text-secondary,#C9C4D6)]',
  bgColor: 'bg-[#171226]',
  borderColor: 'border-[var(--border-color,#302741)]',
  icon: HelpCircle,
  defaultPulse: false,
};

const SIZE_CONFIGS = {
  xs: {
    container: 'px-1.5 py-0.5 text-[9px] rounded-md gap-1',
    iconSize: 'w-2.5 h-2.5',
  },
  sm: {
    container: 'px-2 py-0.5 text-[10px] rounded-lg gap-1.5',
    iconSize: 'w-3 h-3',
  },
  md: {
    container: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
    iconSize: 'w-3.5 h-3.5',
  },
};

/**
 * Reusable StatusBadge Component
 * Renders color-coded, accessible status labels for registration requests and entity states,
 * bound to the core CSS variable color tokens.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  withPulse,
  label,
  className = '',
}) => {
  const normalizedKey = normalizeStatus(status);
  const config = STATUS_CONFIGS[normalizedKey] || {
    ...DEFAULT_CONFIG,
    label: status ? status.replace(/_/g, ' ') : DEFAULT_CONFIG.label,
  };

  const IconComponent = config.icon;
  const isPulseActive = withPulse !== undefined ? withPulse : Boolean(config.defaultPulse);
  const sizeStyles = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;
  const displayLabel = label || config.label;

  return (
    <span
      role="status"
      aria-label={`Status: ${displayLabel}`}
      className={`inline-flex items-center font-bold font-mono uppercase tracking-wider border select-none transition-colors whitespace-nowrap shrink-0 ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeStyles.container} ${
        isPulseActive ? 'animate-pulse' : ''
      } ${className}`}
    >
      {showIcon && (
        <IconComponent
          aria-hidden="true"
          className={`${sizeStyles.iconSize} shrink-0 stroke-[2.2]`}
        />
      )}
      <span className="leading-none">{displayLabel}</span>
    </span>
  );
};
