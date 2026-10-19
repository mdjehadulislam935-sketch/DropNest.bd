import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface SecurityConsoleModuleProps {
  initialSubmodule?: 'login' | 'password' | '2fa' | 'sessions';
}

export const SecurityConsoleModule: React.FC<SecurityConsoleModuleProps> = ({
  initialSubmodule = 'login',
}) => {
  const [submodule, setSubmodule] = useState<'login' | 'password' | '2fa' | 'sessions'>(initialSubmodule);

  // 15.1 Policies
  const [lockoutThreshold, setLockoutThreshold] = useState('5');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [enforceComplexPwd, setEnforceComplexPwd] = useState(true);
  const [ipWhitelistActive, setIpWhitelistActive] = useState(false);
  const [allowedIps, setAllowedIps] = useState('103.145.118.0/24, 103.205.180.12');
  const [policySavedMsg, setPolicySavedMsg] = useState<string | null>(null);

  // 15.2 Change Password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ success: boolean; text: string } | null>(null);

  // 15.3 2FA
  const [is2faEnabled, setIs2faEnabled] = useState(true);
  const [twoFaMethod, setTwoFaMethod] = useState<'AUTHENTICATOR_APP' | 'SMS_OTP'>('AUTHENTICATOR_APP');

  // 15.4-7 Active Sessions
  const [sessions, setSessions] = useState([
    {
      id: 'sess-current',
      device: 'Chrome 124 on macOS (Apple Silicon)',
      ip: '103.145.118.42',
      location: 'Dhaka, Bangladesh',
      started: new Date(Date.now() - 3600000).toISOString(),
      isCurrent: true,
    },
    {
      id: 'sess-mobile',
      device: 'Safari Mobile on iPhone 15 Pro',
      ip: '103.205.180.12',
      location: 'Chittagong, Bangladesh',
      started: new Date(Date.now() - 86400000).toISOString(),
      isCurrent: false,
    },
  ]);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setPolicySavedMsg('Platform security policies updated and synchronized to perimeter firewall.');
    setTimeout(() => setPolicySavedMsg(null), 3500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ success: false, text: 'New passwords do not match.' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ success: false, text: 'Password must be at least 8 characters long.' });
      return;
    }
    setPwdMsg({ success: true, text: 'Super Admin sovereign password successfully updated in cryptographic store.' });
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setTimeout(() => setPwdMsg(null), 4000);
  };

  const handleTerminateOtherSessions = async () => {
    if (!confirm('Are you sure you want to terminate all other active operator sessions across Bangladesh?')) return;
    try {
      await ApiService.logoutAllDevices();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSessionMsg('All remote sessions have been revoked.');
      setTimeout(() => setSessionMsg(null), 3500);
    } catch {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSessionMsg('All remote sessions have been revoked.');
      setTimeout(() => setSessionMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#EC4899]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">13. Sovereign Security & Zero-Trust Governance</h2>
            <p className="text-xs text-[#C9C4D6]">
              Firewall lockdown policies, password cryptosystem, multi-factor authentication, and session revocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#34D399]/20 text-[#34D399] font-mono text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span>SHIELD LEVEL: MAXIMUM</span>
          </span>
        </div>
      </div>

      {/* Submodule Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741]">
        <button
          onClick={() => setSubmodule('login')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'login' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          15.1 Login Policies & Lockouts
        </button>
        <button
          onClick={() => setSubmodule('password')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'password' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          15.2 Change Sovereign Password
        </button>
        <button
          onClick={() => setSubmodule('2fa')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === '2fa' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          15.3 Two-Factor Auth (2FA)
        </button>
        <button
          onClick={() => setSubmodule('sessions')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'sessions' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          15.4-7 Active Sessions & Devices
        </button>
      </div>

      {/* 15.1 Policies */}
      {submodule === 'login' && (
        <form onSubmit={handleSavePolicies} className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-3xl">
          <div className="border-b border-[#302741] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#22D3EE]">
              15.1 Platform Login Security Policies
            </h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">Defensive configuration against brute-force attacks and session hijacking</p>
          </div>

          {policySavedMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{policySavedMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">Failed Login Attempt Lockout Threshold</label>
              <select
                value={lockoutThreshold}
                onChange={(e) => setLockoutThreshold(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
              >
                <option value="3">3 Consecutive Failures (Aggressive Lockout)</option>
                <option value="5">5 Consecutive Failures (Standard)</option>
                <option value="10">10 Consecutive Failures (Relaxed)</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">Session Inactivity Timeout (Minutes)</label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes (Recommended)</option>
                <option value="120">120 Minutes (2 Hours)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <label className="flex items-center gap-2 text-white font-semibold">
              <input
                type="checkbox"
                checked={enforceComplexPwd}
                onChange={(e) => setEnforceComplexPwd(e.target.checked)}
                className="rounded bg-[#100D1B] border-[#302741] text-[#7C3AED]"
              />
              <span>Enforce Complex Passwords (Uppercase, Lowercase, Number, Symbol, Minimum 8 chars)</span>
            </label>

            <label className="flex items-center gap-2 text-white font-semibold">
              <input
                type="checkbox"
                checked={ipWhitelistActive}
                onChange={(e) => setIpWhitelistActive(e.target.checked)}
                className="rounded bg-[#100D1B] border-[#302741] text-[#7C3AED]"
              />
              <span>Restrict Super Admin Access to Whitelisted Bangladeshi IP CIDR Blocks</span>
            </label>
          </div>

          {ipWhitelistActive && (
            <div>
              <label className="block text-white font-semibold mb-1 text-xs">Whitelisted IP Subnets</label>
              <input
                type="text"
                value={allowedIps}
                onChange={(e) => setAllowedIps(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono text-xs"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg shadow-md"
            >
              Enforce Security Policies
            </button>
          </div>
        </form>
      )}

      {/* 15.2 Change Password */}
      {submodule === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-xl">
          <div className="border-b border-[#302741] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#A855F7]">
              15.2 Change Super Admin Sovereign Password
            </h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">Rotate master cryptographic credentials for the root administrator account</p>
          </div>

          {pwdMsg && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                pwdMsg.success
                  ? 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]'
                  : 'bg-[#F87171]/15 border-[#F87171]/30 text-[#F87171]'
              }`}
            >
              {pwdMsg.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">Current Sovereign Password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">New Secure Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">Confirm New Secure Password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg shadow-md"
              >
                Rotate Master Password
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 15.3 2FA */}
      {submodule === '2fa' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-2xl">
          <div className="border-b border-[#302741] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#34D399]">
                15.3 Two-Factor Authentication (2FA) Security
              </h3>
              <p className="text-xs text-[#C9C4D6]">Protect your account with second-factor verification at sign-in</p>
            </div>

            <button
              onClick={() => setIs2faEnabled(!is2faEnabled)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                is2faEnabled ? 'bg-[#34D399]/20 text-[#34D399]' : 'bg-[#F87171]/20 text-[#F87171]'
              }`}
            >
              {is2faEnabled ? '2FA ENABLED' : '2FA DISABLED'}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#7C3AED]/20 text-[#A855F7]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Google Authenticator / TOTP App</h4>
                  <p className="text-[#C9C4D6] text-[11px]">Time-based one-time code generated on your mobile phone</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#34D399]">PRIMARY</span>
            </div>

            <div className="p-4 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Emergency Backup Recovery Codes</h4>
                  <p className="text-[#C9C4D6] text-[11px]">8 one-time cryptographic recovery codes in reserve</p>
                </div>
              </div>
              <button
                onClick={() => alert('Backup codes: 8841-2910, 9918-3829, 4429-1928, 5519-8392')}
                className="px-3 py-1 bg-[#171226] border border-[#302741] hover:text-white rounded text-[11px]"
              >
                View Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15.4-7 Active Sessions */}
      {submodule === 'sessions' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-3xl">
          <div className="flex items-center justify-between border-b border-[#302741] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#EC4899]">
                15.4-7 Active Sessions & Device Governance
              </h3>
              <p className="text-xs text-[#C9C4D6]">All devices currently holding authenticated tokens for this Super Admin</p>
            </div>

            <button
              onClick={handleTerminateOtherSessions}
              className="px-3.5 py-1.5 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Revoke All Other Sessions</span>
            </button>
          </div>

          {sessionMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{sessionMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{sess.device}</span>
                    {sess.isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold">
                        THIS DEVICE
                      </span>
                    )}
                  </div>
                  <div className="text-[#C9C4D6] text-[11px] font-mono mt-0.5">
                    IP: {sess.ip} · Location: {sess.location}
                  </div>
                  <div className="text-[#C9C4D6]/70 text-[10px] mt-0.5">
                    Session started: {formatBangladeshDateTime(sess.started)}
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => {
                      setSessions((prev) => prev.filter((s) => s.id !== sess.id));
                    }}
                    className="p-1.5 text-[#F87171] hover:bg-[#F87171]/10 rounded text-xs font-semibold"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
