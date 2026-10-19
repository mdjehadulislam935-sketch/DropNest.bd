import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  CheckCircle,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
  UserCheck
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { UserAccount, UserLoginActivity, UserRole } from '../../../types/platform.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface LoginSecurityModuleProps {
  initialSubmodule?: 'desig-list' | 'admin-rst' | 'mod-rst' | 'res-rst' | 'admin-exp' | 'activity';
}

export const LoginSecurityModule: React.FC<LoginSecurityModuleProps> = ({
  initialSubmodule = 'activity',
}) => {
  const [submodule, setSubmodule] = useState<'desig-list' | 'admin-rst' | 'mod-rst' | 'res-rst' | 'admin-exp' | 'activity'>(initialSubmodule);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activities, setActivities] = useState<UserLoginActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Password reset state
  const [targetUserId, setTargetUserId] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [forceNextChange, setForceNextChange] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Expiration renewal state
  const [expUserId, setExpUserId] = useState('');
  const [addMonths, setAddMonths] = useState('6');
  const [renewing, setRenewing] = useState(false);
  const [renewMsg, setRenewMsg] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, aList] = await Promise.all([
        ApiService.getAllUsers().catch(() => []),
        ApiService.getLoginActivities().catch(() => []),
      ]);
      setUsers(uList);
      setActivities(aList);
      if (uList.length > 0) {
        setTargetUserId(uList[0].id);
        setExpUserId(uList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;
    setResetting(true);
    setResetSuccessMsg(null);
    try {
      const res = await ApiService.resetUserPassword(
        targetUserId,
        manualPassword || undefined,
        forceNextChange
      );
      setResetSuccessMsg(res.message || 'Password successfully reset.');
      setManualPassword('');
      setTimeout(() => setResetSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Password reset failed');
    } finally {
      setResetting(false);
    }
  };

  const handleRenewExpiration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expUserId) return;
    setRenewing(true);
    setRenewMsg(null);
    try {
      const months = parseInt(addMonths, 10) || 6;
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + months);
      const updatedUser = await ApiService.updateUserDesignation(
        expUserId,
        users.find((u) => u.id === expUserId)?.designation || 'Staff',
        targetDate.toISOString()
      );
      setUsers((prev) => prev.map((u) => (u.id === expUserId ? updatedUser : u)));
      setRenewMsg(`Account validity for ${updatedUser.fullName} extended by ${months} months.`);
      setTimeout(() => setRenewMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to renew expiration');
    } finally {
      setRenewing(false);
    }
  };

  const admins = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
  const moderators = users.filter((u) => u.role === 'MODERATOR');
  const resellers = users.filter((u) => u.role === 'RESELLER');

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">8. User Login Security & Access Governance</h2>
            <p className="text-xs text-[#C9C4D6]">
              Real-time authentication telemetry, granular password resets, expiry renewal, and audit records
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
          title="Refresh Security Ledger"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Submodule Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741]">
        <button
          onClick={() => setSubmodule('activity')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'activity' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          10.7 Login Activity Log ({activities.length})
        </button>
        <button
          onClick={() => setSubmodule('desig-list')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'desig-list' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          10.1 Designation Users
        </button>
        <button
          onClick={() => {
            setSubmodule('admin-rst');
            if (admins.length > 0) setTargetUserId(admins[0].id);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'admin-rst' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          10.2 Admin Password Reset
        </button>
        <button
          onClick={() => {
            setSubmodule('mod-rst');
            if (moderators.length > 0) setTargetUserId(moderators[0].id);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'mod-rst' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          10.3 Moderator Password Reset
        </button>
        <button
          onClick={() => {
            setSubmodule('res-rst');
            if (resellers.length > 0) setTargetUserId(resellers[0].id);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'res-rst' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          10.4 Reseller Password Reset
        </button>
        <button
          onClick={() => setSubmodule('admin-exp')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'admin-exp' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          10.6 Expiration Renewal
        </button>
      </div>

      {/* 10.7 All User Login Activity */}
      {submodule === 'activity' && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-white">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#34D399]" />
              <span>Real-Time Authentication Event Stream</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A855F7]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter IP, User, Browser..."
                className="bg-[#171226] border border-[#302741] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User & Role</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Device / Browser</th>
                  <th className="px-4 py-3 text-center">Auth Result</th>
                  <th className="px-4 py-3 text-center">Security Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {activities
                  .filter((a) => {
                    const q = search.toLowerCase();
                    return (
                      a.userName.toLowerCase().includes(q) ||
                      a.ipAddress.includes(q) ||
                      a.deviceBrowser.toLowerCase().includes(q)
                    );
                  })
                  .map((act) => (
                    <tr key={act.id} className="hover:bg-[#100D1B] transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#22D3EE] whitespace-nowrap">
                        {formatBangladeshDateTime(act.loginTime)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{act.userName}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#302741] text-[#A855F7] font-mono">
                          {act.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-white whitespace-nowrap">{act.ipAddress}</td>
                      <td className="px-4 py-3 text-[#C9C4D6] max-w-xs truncate">{act.deviceBrowser}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.result === 'SUCCESS'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : 'bg-[#F87171]/20 text-[#F87171]'
                          }`}
                        >
                          {act.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {act.isSuspicious ? (
                          <span className="px-2 py-0.5 rounded bg-[#F87171]/20 text-[#F87171] text-[10px] font-bold flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>SUSPICIOUS</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#34D399] font-mono">NORMAL</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10.1 Designation Users */}
      {submodule === 'desig-list' && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex items-center justify-between text-xs font-semibold text-white">
            <span>Staff Members Grouped by Designation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Staff Name</th>
                  <th className="px-4 py-3">Assigned Designation</th>
                  <th className="px-4 py-3">Panel Role</th>
                  <th className="px-4 py-3">Mobile ID</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#100D1B]">
                    <td className="px-4 py-3 font-bold text-white">{u.fullName}</td>
                    <td className="px-4 py-3 text-[#22D3EE] font-medium">{u.designation || 'General Staff'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] font-bold text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{u.mobile}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#FBBF24]">
                      {u.expiresAt ? formatBangladeshDateTime(u.expiresAt) : 'Never Expiring'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10.2 / 10.3 / 10.4 Password Reset Forms */}
      {(submodule === 'admin-rst' || submodule === 'mod-rst' || submodule === 'res-rst') && (
        <form onSubmit={handleResetPassword} className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-2xl">
          <div className="border-b border-[#302741] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#EC4899]">
              {submodule === 'admin-rst'
                ? '10.2 Administrator Password Reset'
                : submodule === 'mod-rst'
                ? '10.3 Moderator Password Reset'
                : '10.4 Reseller Password Reset'}
            </h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">
              Secure cryptographic password reset with optional mandatory change upon next sign-in
            </p>
          </div>

          {resetSuccessMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{resetSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">Select Target Account</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
              >
                {(submodule === 'admin-rst'
                  ? admins
                  : submodule === 'mod-rst'
                  ? moderators
                  : resellers
                ).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.mobile}) - {u.role} [{u.designation || 'Staff'}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">
                New Temporary Password (leave blank to auto-generate)
              </label>
              <input
                type="text"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder="Auto-generated secure passphrase if left empty"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="forceChange"
                checked={forceNextChange}
                onChange={(e) => setForceNextChange(e.target.checked)}
                className="rounded bg-[#100D1B] border-[#302741] text-[#7C3AED]"
              />
              <label htmlFor="forceChange" className="text-xs text-[#C9C4D6]">
                Force user to change password immediately on next login
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={resetting}
                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg shadow-md"
              >
                {resetting ? 'Resetting Password...' : 'Execute Password Reset'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 10.6 Admin Expiration Renewal */}
      {submodule === 'admin-exp' && (
        <form onSubmit={handleRenewExpiration} className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-2xl">
          <div className="border-b border-[#302741] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#34D399]">
              10.6 Administrative Expiration Renewal & Account Extension
            </h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">
              Extend access credentials for time-bounded operators and staff personnel
            </p>
          </div>

          {renewMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{renewMsg}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">Select Administrative Account</label>
              <select
                value={expUserId}
                onChange={(e) => setExpUserId(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
              >
                {admins.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.mobile}) - Current Expiry:{' '}
                    {u.expiresAt ? formatBangladeshDateTime(u.expiresAt) : 'Never'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">Validity Extension Period</label>
              <select
                value={addMonths}
                onChange={(e) => setAddMonths(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
              >
                <option value="1">1 Month Extension</option>
                <option value="3">3 Months Extension</option>
                <option value="6">6 Months Extension (Standard)</option>
                <option value="12">12 Months (1 Year Extension)</option>
                <option value="24">24 Months (2 Years)</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={renewing}
                className="px-5 py-2 bg-[#34D399] hover:bg-[#10B981] text-black font-bold rounded-lg shadow-md"
              >
                {renewing ? 'Renewing...' : 'Extend Validity Period'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
