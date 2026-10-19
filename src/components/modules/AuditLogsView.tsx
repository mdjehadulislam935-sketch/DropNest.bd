import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, Shield, ShieldAlert, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiService } from '../../services/api.ts';
import type { AuditRecord } from '../../types/platform.ts';
import { formatBangladeshDateTime } from '../../utils/formatters.ts';

export const AuditLogsView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('SUCCESS')) return 'text-[#34D399] bg-[#34D399]/15 border-[#34D399]/30';
    if (action.includes('DENIED') || action.includes('FAILED') || action.includes('ATTEMPT'))
      return 'text-[#F87171] bg-[#F87171]/15 border-[#F87171]/30';
    if (action.includes('ORDER')) return 'text-[#22D3EE] bg-[#22D3EE]/15 border-[#22D3EE]/30';
    if (action.includes('PRODUCT')) return 'text-[#A855F7] bg-[#A855F7]/15 border-[#A855F7]/30';
    return 'text-[#FBBF24] bg-[#FBBF24]/15 border-[#FBBF24]/30';
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#EC4899]" />
            <span>Immutable Platform Security Audit Trail</span>
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            Cryptographically sealed event ledger tracking authenticated operations, logins, orders, and role changes
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
          title="Refresh audit ledger"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#C9C4D6]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#7C3AED] mb-2" />
            <span>Verifying audit record signatures...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#C9C4D6]">
            <FileText className="w-8 h-8 mx-auto text-[#302741] mb-2" />
            <p className="text-sm font-semibold text-white">Audit Ledger Empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Timestamp (BST)</th>
                  <th className="px-4 py-3">Actor & Role</th>
                  <th className="px-4 py-3">Security Action</th>
                  <th className="px-4 py-3">Event Details</th>
                  <th className="px-4 py-3 text-right">Event ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#100D1B] transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-white whitespace-nowrap">
                      {formatBangladeshDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{log.actorName}</div>
                      <div className="text-[10px] text-[#22D3EE] font-mono">{log.actorRole}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white max-w-md">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] text-[#C9C4D6]/70">
                      {log.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
