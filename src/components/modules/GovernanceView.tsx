import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle,
  Database,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiService } from '../../services/api.ts';

export const GovernanceView: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getPlatformStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#EC4899]" />
            <span>Platform Security Governance & RBAC Enforcement</span>
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            Strict Role-Based Access Control matrix separating Reseller, Supplier, Moderator, Admin, and Super Admin
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
          title="Refresh stats"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#A855F7] uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Authentication Engine</span>
          </div>
          <p className="text-xs text-[#C9C4D6]">
            Passwords cryptographically salted and hashed using Node scrypt. Timing-safe verification prevents side-channel enumeration attacks.
          </p>
          <div className="text-[11px] font-mono text-[#34D399]">
            Hashing: SCRYPT-64 (Salt 16B)
          </div>
        </div>

        <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Rate Limiting & Headers</span>
          </div>
          <p className="text-xs text-[#C9C4D6]">
            X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, and client IP request sliding windows protect API endpoints from brute-force.
          </p>
          <div className="text-[11px] font-mono text-[#34D399]">
            Security Headers: ACTIVE
          </div>
        </div>

        <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#34D399] uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Supplier Isolation</span>
          </div>
          <p className="text-xs text-[#C9C4D6]">
            Supplier views sanitize reseller identity, store names, customer mobile numbers, and selling prices on the database query layer.
          </p>
          <div className="text-[11px] font-mono text-[#34D399]">
            Privacy Shield: ENFORCED
          </div>
        </div>
      </div>

      {/* Role Access Matrix */}
      <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#302741] bg-[#100D1B]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            DropNest 5-Tier Role Privilege Matrix
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#C9C4D6]">
            <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
              <tr>
                <th className="px-4 py-3">Platform Role</th>
                <th className="px-4 py-3">Public Registration</th>
                <th className="px-4 py-3">Catalog Actions</th>
                <th className="px-4 py-3">Order Visibility</th>
                <th className="px-4 py-3">Top Info Bar</th>
                <th className="px-4 py-3">Audit Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#302741]">
              <tr className="hover:bg-[#100D1B]">
                <td className="px-4 py-3 font-bold text-[#34D399]">RESELLER</td>
                <td className="px-4 py-3 text-white">Allowed (Self-Signup)</td>
                <td className="px-4 py-3">Browse Approved Items & Export Specs</td>
                <td className="px-4 py-3">Own Store Orders Only</td>
                <td className="px-4 py-3 text-[#F87171]">Hidden</td>
                <td className="px-4 py-3 text-[#F87171]">Forbidden</td>
              </tr>
              <tr className="hover:bg-[#100D1B]">
                <td className="px-4 py-3 font-bold text-[#FBBF24]">SUPPLIER</td>
                <td className="px-4 py-3 text-white">Allowed (With Trade License)</td>
                <td className="px-4 py-3">Submit Factory Products & Stock</td>
                <td className="px-4 py-3">Platform Company Orders (Anonymized)</td>
                <td className="px-4 py-3 text-[#F87171]">Hidden</td>
                <td className="px-4 py-3 text-[#F87171]">Forbidden</td>
              </tr>
              <tr className="hover:bg-[#100D1B]">
                <td className="px-4 py-3 font-bold text-[#22D3EE]">MODERATOR</td>
                <td className="px-4 py-3 text-[#F87171]">Admin Assigned Only</td>
                <td className="px-4 py-3">Approve / Reject Supplier Submissions</td>
                <td className="px-4 py-3">All Platform Orders</td>
                <td className="px-4 py-3 text-[#34D399]">Visible</td>
                <td className="px-4 py-3 text-[#34D399]">Read-Only</td>
              </tr>
              <tr className="hover:bg-[#100D1B]">
                <td className="px-4 py-3 font-bold text-[#A855F7]">ADMIN</td>
                <td className="px-4 py-3 text-[#F87171]">Admin Assigned Only</td>
                <td className="px-4 py-3">Full Master Product Management</td>
                <td className="px-4 py-3">Full Master Order Tracking</td>
                <td className="px-4 py-3 text-[#34D399]">Visible</td>
                <td className="px-4 py-3 text-[#34D399]">Full Access</td>
              </tr>
              <tr className="hover:bg-[#100D1B]">
                <td className="px-4 py-3 font-bold text-[#EC4899]">SUPER_ADMIN</td>
                <td className="px-4 py-3 text-[#F87171]">Sovereign System Only</td>
                <td className="px-4 py-3">Full Master Product Management</td>
                <td className="px-4 py-3">Full Master Order Tracking</td>
                <td className="px-4 py-3 text-[#34D399]">Visible</td>
                <td className="px-4 py-3 text-[#34D399]">Master Sovereign Audit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
