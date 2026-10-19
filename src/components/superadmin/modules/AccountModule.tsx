import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Server,
  Wallet
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { ApiServiceItem, FinancialSummary, LedgerTransaction } from '../../../types/platform.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface AccountModuleProps {
  initialSubmodule?: 'balance' | 'debit' | 'credit' | 'statement' | 'apis';
}

export const AccountModule: React.FC<AccountModuleProps> = ({
  initialSubmodule = 'balance',
}) => {
  const [submodule, setSubmodule] = useState<'balance' | 'debit' | 'credit' | 'statement' | 'apis'>(initialSubmodule);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [apis, setApis] = useState<ApiServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statementRange, setStatementRange] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const [finSummary, txns, apiList] = await Promise.all([
        ApiService.getFinancialSummary().catch(() => null),
        ApiService.getLedgerTransactions().catch(() => []),
        ApiService.getApiServices().catch(() => []),
      ]);
      setSummary(finSummary);
      setTransactions(txns);
      setApis(apiList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  // Filter transactions
  const filteredTxns = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.id.toLowerCase().includes(q) ||
      t.purpose.toLowerCase().includes(q) ||
      t.recipientOrSource.toLowerCase().includes(q) ||
      t.referenceNumber.toLowerCase().includes(q);

    if (submodule === 'debit') return matchSearch && t.type === 'DEBIT';
    if (submodule === 'credit') return matchSearch && t.type === 'CREDIT';
    return matchSearch;
  });

  const exportCSV = (list: LedgerTransaction[], filename: string) => {
    const headers = ['Transaction ID', 'Type', 'Amount (BDT)', 'Category', 'Purpose', 'Party', 'Method', 'Reference', 'Date', 'Status'];
    const rows = list.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.category,
      `"${t.purpose.replace(/"/g, '""')}"`,
      `"${t.recipientOrSource.replace(/"/g, '""')}"`,
      `"${t.paymentMethod}"`,
      t.referenceNumber,
      t.timestamp,
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Module Navigation Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">2. Super Admin Account & Financial Ledger</h2>
            <p className="text-xs text-[#C9C4D6]">
              Real-time sovereign balances, debit & credit ledgers, statements, and financial API credentials
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741]">
          <button
            onClick={() => setSubmodule('balance')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'balance' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            4.1 Balance
          </button>
          <button
            onClick={() => setSubmodule('debit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'debit' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            4.2 Debit History
          </button>
          <button
            onClick={() => setSubmodule('credit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'credit' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            4.3 Credit History
          </button>
          <button
            onClick={() => setSubmodule('statement')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'statement' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            4.4 Statement
          </button>
          <button
            onClick={() => setSubmodule('apis')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'apis' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            4.5 API Setting
          </button>
        </div>
      </div>

      {/* 4.1 Balance Overview Submodule */}
      {submodule === 'balance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl">
              <span className="text-xs text-[#C9C4D6] font-semibold">Super Admin Account Balance</span>
              <div className="text-2xl font-bold text-white font-mono tabular-nums mt-2">
                {formatBDT(summary?.superAdminBalance || 0)}
              </div>
              <div className="text-[11px] text-[#34D399] mt-1">Verified Sovereign Ledger</div>
            </div>

            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl">
              <span className="text-xs text-[#C9C4D6] font-semibold">Total Platform Balance</span>
              <div className="text-2xl font-bold text-[#22D3EE] font-mono tabular-nums mt-2">
                {formatBDT(summary?.totalPlatformBalance || 0)}
              </div>
              <div className="text-[11px] text-[#22D3EE] mt-1">Includes In-Flight Escrows</div>
            </div>

            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl">
              <span className="text-xs text-[#C9C4D6] font-semibold">Available Spendable Funds</span>
              <div className="text-2xl font-bold text-[#34D399] font-mono tabular-nums mt-2">
                {formatBDT(summary?.availableBalance || 0)}
              </div>
              <div className="text-[11px] text-[#C9C4D6]/70 mt-1">Unencumbered Liquidity</div>
            </div>

            <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl">
              <span className="text-xs text-[#C9C4D6] font-semibold">Pending & Reserved Liabilities</span>
              <div className="text-2xl font-bold text-[#FBBF24] font-mono tabular-nums mt-2">
                {formatBDT(summary?.reservedBalance || 0)}
              </div>
              <div className="text-[11px] text-[#FBBF24] mt-1">5% Courier Risk Buffer Held</div>
            </div>
          </div>

          {/* Ledger Totals Strip */}
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-[#C9C4D6]">All-Time Credits:</span>{' '}
                <strong className="text-[#34D399] font-mono tabular-nums">{formatBDT(summary?.totalCredit || 0)}</strong>
              </div>
              <div>
                <span className="text-[#C9C4D6]">All-Time Debits:</span>{' '}
                <strong className="text-[#F87171] font-mono tabular-nums">{formatBDT(summary?.totalDebit || 0)}</strong>
              </div>
            </div>

            <button
              onClick={() => exportCSV(transactions, 'DropNest_Ledger_Transactions')}
              className="px-3.5 py-1.5 rounded-lg bg-[#100D1B] border border-[#302741] hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Ledger CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* 4.2 Debit History / 4.3 Credit History Tables */}
      {(submodule === 'debit' || submodule === 'credit' || submodule === 'balance') && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#302741] bg-[#100D1B] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {submodule === 'debit'
                  ? '4.2 Debit History Ledger'
                  : submodule === 'credit'
                  ? '4.3 Credit History Ledger'
                  : 'Recent Verified Ledger Entries'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A855F7]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Txn ID, Purpose, Ref..."
                  className="bg-[#171226] border border-[#302741] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                onClick={() => exportCSV(filteredTxns, `DropNest_${submodule}_Report`)}
                className="p-2 rounded-lg bg-[#171226] border border-[#302741] text-[#C9C4D6] hover:text-white"
                title="Export filtered records"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Txn ID & Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Purpose & Details</th>
                  <th className="px-4 py-3">Source / Recipient</th>
                  <th className="px-4 py-3">Payment Method & Ref</th>
                  <th className="px-4 py-3 text-right">Amount (BDT)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#C9C4D6]">
                      No transactions recorded under this filter.
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((t) => (
                    <tr key={t.id} className="hover:bg-[#100D1B] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-white">{t.id}</div>
                        <div className="text-[10px] text-[#22D3EE] font-mono">{formatBangladeshDateTime(t.timestamp)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            t.type === 'CREDIT'
                              ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30'
                              : 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30'
                          }`}
                        >
                          {t.type === 'CREDIT' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-white truncate">{t.purpose}</div>
                        <div className="text-[10px] text-[#C9C4D6]/70">By: {t.processedBy}</div>
                      </td>
                      <td className="px-4 py-3 text-white truncate max-w-xs">{t.recipientOrSource}</td>
                      <td className="px-4 py-3">
                        <div className="text-white">{t.paymentMethod}</div>
                        <div className="font-mono text-[10px] text-[#22D3EE]">{t.referenceNumber}</div>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold text-sm tabular-nums ${t.type === 'CREDIT' ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                        {t.type === 'CREDIT' ? '+' : '-'}{formatBDT(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4.4 Statement Submodule */}
      {submodule === 'statement' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-4xl">
          <div className="border-b border-[#302741] pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#34D399]">
                4.4 Financial Reconciliation Statement
              </h3>
              <p className="text-xs text-[#C9C4D6]">
                Opening vs Closing balances reconciled against verified ledger items
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setStatementRange(r)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    statementRange === r ? 'bg-[#7C3AED] text-white' : 'bg-[#100D1B] text-[#C9C4D6]'
                  }`}
                >
                  {r}
                </button>
              ))}

              <button
                onClick={() => exportCSV(transactions, `DropNest_${statementRange}_Statement`)}
                className="px-3 py-1 bg-[#34D399] hover:bg-[#10B981] text-black rounded text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[#100D1B] border border-[#302741] text-xs font-mono">
            <div>
              <span className="text-[#C9C4D6]">Opening Balance:</span>
              <div className="text-base font-bold text-white mt-1">৳ 0.00</div>
            </div>
            <div>
              <span className="text-[#34D399]">Total Inflows (Credit):</span>
              <div className="text-base font-bold text-[#34D399] mt-1">{formatBDT(summary?.totalCredit || 0)}</div>
            </div>
            <div>
              <span className="text-[#F87171]">Total Outflows (Debit):</span>
              <div className="text-base font-bold text-[#F87171] mt-1">{formatBDT(summary?.totalDebit || 0)}</div>
            </div>
            <div>
              <span className="text-[#22D3EE]">Reconciled Closing:</span>
              <div className="text-base font-bold text-[#22D3EE] mt-1">{formatBDT(summary?.superAdminBalance || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* 4.5 API Setting Submodule */}
      {submodule === 'apis' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-4xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#22D3EE]">
            4.5 Financial & Payment Gateway API Configurations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {apis.filter((a) => a.category === 'PAYMENT').map((api) => (
              <div key={api.id} className="p-4 bg-[#100D1B] border border-[#302741] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{api.name}</span>
                  <span className="px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold">
                    {api.status}
                  </span>
                </div>
                <div className="text-xs text-[#C9C4D6]">Provider: {api.provider}</div>
                <div className="text-xs font-mono text-[#22D3EE]">{api.apiKeyMasked}</div>
                <div className="text-[11px] text-[#C9C4D6]/70">Endpoint: {api.baseUrl}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
