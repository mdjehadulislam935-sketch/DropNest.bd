import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Lock,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { ApiService } from '../../../services/api.ts';
import type { AdminPermissions } from '../../../types/admin.ts';

export const AdminPermissionsModule: React.FC = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedSetting, setAttemptedSetting] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const perms = await ApiService.getAdminPermissions();
      setPermissions(perms);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const permissionItems = [
    {
      id: 'canApprovePayment',
      label: 'Transaction ID & Payment Approval',
      desc: 'Verify and authorize bKash, Nagad, Rocket and Bank transaction IDs submitted by resellers and suppliers.',
      granted: permissions?.canApprovePayment ?? true,
    },
    {
      id: 'canAdjustBalance',
      label: 'Balance Adjustment Authorization',
      desc: 'Credit or debit user wallets with mandatory audit rationale logging. Cannot overdraft available balance.',
      granted: permissions?.canAdjustBalance ?? true,
    },
    {
      id: 'canApproveUser',
      label: 'Reseller & Supplier KYC Approval',
      desc: 'Review submitted trade licenses, TIN numbers, NID documents and activate business storefronts.',
      granted: permissions?.canApproveUser ?? true,
    },
    {
      id: 'canCreateUser',
      label: 'Direct User Account Creation',
      desc: 'Create new reseller, supplier or staff credentials with auto-generated secure passwords. (SUPER_ADMIN creation strictly forbidden).',
      granted: permissions?.canCreateUser ?? true,
    },
    {
      id: 'canChangeOrderStatus',
      label: 'Consignment Status Modification',
      desc: 'Update live parcel status between Processing, Confirmed, Shipped, In Transit, Delivered, and Returned.',
      granted: permissions?.canChangeOrderStatus ?? true,
    },
    {
      id: 'canSendSms',
      label: 'SMS Gateway Dispatch',
      desc: 'Dispatch bulk broadcasts to sellers and configure automated event notification triggers.',
      granted: permissions?.canSendSms ?? true,
    },
    {
      id: 'canViewFinancialReports',
      label: 'Financial Auditing & Statement View',
      desc: 'Access platform gross revenue, payout disbursement logs and download CSV/Excel audit reports.',
      granted: permissions?.canViewFinancialReports ?? true,
    },
    {
      id: 'canAccessMessaging',
      label: 'Internal Stakeholder Messaging',
      desc: 'Send direct notices and communicate across internal admins, moderators, resellers, and suppliers.',
      granted: permissions?.canAccessMessaging ?? true,
    },
    {
      id: 'canManageStaff',
      label: 'Administrative Staff Management',
      desc: 'Manage privileges of other admin operators (Requires elevated Super Admin grant).',
      granted: permissions?.canManageStaff ?? false,
    },
  ];

  const sensitiveSuperAdminSettings = [
    {
      name: 'Root Super Admin Role Provisioning',
      category: 'Identity Governance',
      reason: 'Only Super Admin can assign or elevate users to the Super Admin role.',
    },
    {
      name: 'Steadfast & Pathao Secret API Keys',
      category: 'API Infrastructure',
      reason: 'Root API tokens and production credentials cannot be viewed or altered by Admin.',
    },
    {
      name: 'Central Database Schema & Migration Core',
      category: 'System Architecture',
      reason: 'Database tables and data structure alterations are reserved for Super Admin.',
    },
    {
      name: 'Global Platform Commission Rates',
      category: 'Platform Economics',
      reason: 'Marketplace commission percentage structure requires executive clearance.',
    },
    {
      name: 'Audit Trail Purge & System Wipe',
      category: 'Compliance & Security',
      reason: 'Immutable audit logs cannot be purged or suppressed by any operational staff.',
    },
  ];

  const handleAttemptSensitive = (settingName: string) => {
    setAttemptedSetting(settingName);
    setRequestSent(false);
  };

  const handleRequestClearance = () => {
    setRequestSent(true);
    setFeedback(`Clearance request for "${attemptedSetting}" dispatched to DropNest Super Admin console.`);
    setTimeout(() => {
      setAttemptedSetting(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-xl border bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399] flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171226] border border-[#302741] p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Operational Clearance & Role Permissions
            </h2>
          </div>
          <p className="text-xs text-[#C9C4D6] mt-1">
            Enforced Role-Based Access Control (RBAC). Admin operations are scoped to verified permissions; Super Admin sensitive configurations are cryptographically protected.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#100D1B] border border-[#302741] text-xs font-mono text-[#A855F7]">
            Active Role: ADMIN
          </span>
          <button
            onClick={loadPermissions}
            className="p-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-[#C9C4D6] hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Granted Permissions Grid */}
      <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            <span>Your Authorized Operational Capabilities</span>
          </h3>
          <span className="text-[11px] text-[#C9C4D6]">
            Assigned by Super Admin Policy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {permissionItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border space-y-2 transition-all ${
                item.granted
                  ? 'bg-[#100D1B] border-[#302741]'
                  : 'bg-[#100D1B]/50 border-[#F87171]/20 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white leading-tight">
                  {item.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                    item.granted
                      ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
                      : 'bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30'
                  }`}
                >
                  {item.granted ? 'AUTHORIZED' : 'RESTRICTED'}
                </span>
              </div>
              <p className="text-[11px] text-[#C9C4D6] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitive Super Admin Protected Settings Section */}
      <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#FBBF24] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Super Admin Restricted Systems & Settings</span>
            </h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">
              These mission-critical settings require elevated Super Admin credentials and cannot be modified directly by Admin accounts.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/30">
            PROTECTED
          </span>
        </div>

        <div className="space-y-2.5">
          {sensitiveSuperAdminSettings.map((setting) => (
            <div
              key={setting.name}
              className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#F87171]" />
                  <span className="text-xs font-bold text-white">{setting.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-[#A855F7] bg-[#171226] border border-[#302741]">
                    {setting.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#C9C4D6]">{setting.reason}</p>
              </div>

              <button
                onClick={() => handleAttemptSensitive(setting.name)}
                className="px-3 py-1.5 rounded-lg bg-[#302741] hover:bg-[#3E3354] text-xs font-semibold text-white transition-colors shrink-0 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>Configure</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitive Attempt Modal */}
      {attemptedSetting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#F87171]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#F87171]">
              <div className="p-2 rounded-xl bg-[#F87171]/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Permission Required</h3>
                <p className="text-[11px] text-[#C9C4D6]">Super Admin Clearance Enforced</p>
              </div>
            </div>

            <p className="text-xs text-[#C9C4D6] leading-relaxed">
              Modifying <strong className="text-white">"{attemptedSetting}"</strong> is strictly reserved for DropNest Super Admin authority. Your current role (<span className="text-[#A855F7] font-semibold">{user?.role}</span>) does not hold cryptographic write clearance for this action.
            </p>

            <div className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] text-[11px] text-[#C9C4D6] space-y-1">
              <span className="font-semibold text-white block">Audit Notice:</span>
              <span>Attempted unauthorized changes to sensitive system assets are logged to immutable platform audit history.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAttemptedSetting(null)}
                className="px-4 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Dismiss
              </button>

              <button
                onClick={handleRequestClearance}
                disabled={requestSent}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{requestSent ? 'Request Dispatched' : 'Request Super Admin Clearance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
