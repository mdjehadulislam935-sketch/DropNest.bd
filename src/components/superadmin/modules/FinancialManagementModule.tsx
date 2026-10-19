import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  X
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { FinancialSummary, LedgerTransaction, WithdrawalRequest } from '../../../types/platform.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface FinancialManagementModuleProps {
  initialSubmodule?: 'transactions' | 'adjust' | 'withdrawals' | 'payments';
}

export const FinancialManagementModule: React.FC<FinancialManagementModuleProps> = ({
  initialSubmodule = 'transactions',
}) => {
  const [submodule, setSubmodule] = useState<'transactions' | 'adjust' | 'withdrawals' | 'payments'>(initialSubmodule);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Manual Adjustment State
  const [targetMobile, setTargetMobile] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustCategory, setAdjustCategory] = useState<'MANUAL_ADJUSTMENT' | 'DEPOSIT' | 'COMMISSION'>('MANUAL_ADJUSTMENT');
  const [adjustPurpose, setAdjustPurpose] = useState('');
  const [secretPin, setSecretPin] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  // Withdrawal Action State
  const [actionWithdrawalId, setActionWithdrawalId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [payoutRef, setPayoutRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, txns, wList] = await Promise.all([
        ApiService.getFinancialSummary().catch(() => null),
        ApiService.getLedgerTransactions().catch(() => []),
        ApiService.getWithdrawalRequests().catch(() => []),
      ]);
      setSummary(sum);
      setTransactions(txns);
      setWithdrawals(wList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMobile || !adjustAmount || !adjustPurpose) return;
    setAdjusting(true);
    setAdjustSuccessMsg(null);
    try {
      const txn = await ApiService.addManualBalanceAdjustment({
        recipientOrSource: targetMobile,
        amount: parseFloat(adjustAmount),
        type: adjustType,
        category: adjustCategory,
        purpose: adjustPurpose,
        paymentMethod: 'Super Admin Sovereign Override',
        referenceNumber: `SA-ADJ-${Date.now().toString().slice(-6)}`,
      });
      setTransactions([txn, ...transactions]);
      setAdjustSuccessMsg(`Successfully executed ${adjustType} of ${formatBDT(parseFloat(adjustAmount))} for ${targetMobile}.`);
      setTargetMobile('');
      setAdjustAmount('');
      setAdjustPurpose('');
      setSecretPin('');
      await loadData();
      setTimeout(() => setAdjustSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Manual adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  const handleConfirmWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionWithdrawalId) return;
    setProcessingWithdrawal(true);
    try {
      const status = actionType === 'APPROVE' ? 'PAID' : 'REJECTED';
      const updated = await ApiService.updateWithdrawalStatus(
        actionWithdrawalId,
        status,
        rejectReason || undefined,
        payoutRef || undefined
      );
      setWithdrawals((prev) => prev.map((w) => (w.id === actionWithdrawalId ? updated : w)));
      setActionWithdrawalId(null);
      setPayoutRef('');
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update withdrawal');
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  // Filter transactions
  const filteredTxns = transactions.filter((t) => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    const q = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.purpose.toLowerCase().includes(q) ||
      t.recipientOrSource.toLowerCase().includes(q) ||
      t.referenceNumber.toLowerCase().includes(q)
    );
  });

  const exportTxnCSV = () => {
    const headers = ['Txn ID', 'Type', 'Amount (BDT)', 'Category', 'Purpose', 'Counterparty', 'Method', 'Reference', 'Timestamp', 'Status'];
    const rows = filteredTxns.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.category,
      `"${t.purpose.replace(/"/g, '""')}"`,
      `"${t.recipientOrSource.replace(/"/g, '""')}"`,
      t.paymentMethod,
      t.referenceNumber,
      t.timestamp,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `DropNest_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">9. Financial Management & Settlement Engine</h2>
            <p className="text-xs text-[#C9C4D6]">
              Verified sovereign balance ledger, manual adjustments, withdrawal disbursements, and gateway reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {submodule === 'transactions' && (
            <button
              onClick={exportTxnCSV}
              className="px-3.5 py-1.5 rounded-lg bg-[#100D1B] border border-[#302741] hover:text-white text-xs text-[#C9C4D6] flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger CSV</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Submodule Segmented Controls */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741]">
        <button
          onClick={() => setSubmodule('transactions')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'transactions' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          11.1 Transaction List ({transactions.length})
        </button>
        <button
          onClick={() => setSubmodule('adjust')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'adjust' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          11.2 Manually Add / Deduct Balance
        </button>
        <button
          onClick={() => setSubmodule('withdrawals')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'withdrawals' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          11.3 Withdrawal Payouts ({withdrawals.length})
        </button>
        <button
          onClick={() => setSubmodule('payments')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'payments' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          11.4 Payment Gateway Reports
        </button>
      </div>

      {/* 11.1 Transaction List */}
      {submodule === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-[#171226] border border-[#302741] p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1 text-white"
              >
                <option value="ALL">All Categories</option>
                <option value="DEPOSIT">DEPOSIT</option>
                <option value="WITHDRAWAL">WITHDRAWAL</option>
                <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT</option>
                <option value="ORDER_PAYMENT">ORDER_PAYMENT</option>
                <option value="SUPPLIER_PAYOUT">SUPPLIER_PAYOUT</option>
                <option value="COMMISSION">COMMISSION</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A855F7]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Txn ID, Phone, Memo..."
                className="bg-[#100D1B] border border-[#302741] rounded-lg pl-8 pr-3 py-1 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#C9C4D6]">
                <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                  <tr>
                    <th className="px-4 py-3">Txn ID & Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Purpose & Details</th>
                    <th className="px-4 py-3">Counterparty</th>
                    <th className="px-4 py-3">Payment Method & Ref</th>
                    <th className="px-4 py-3 text-right">Amount (BDT)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]">
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[#C9C4D6]">
                        No transactions recorded matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTxns.map((t) => (
                      <tr key={t.id} className="hover:bg-[#100D1B] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-white">{t.id}</div>
                          <div className="text-[10px] text-[#22D3EE] font-mono">
                            {formatBangladeshDateTime(t.timestamp)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                              t.type === 'CREDIT'
                                ? 'bg-[#34D399]/15 text-[#34D399]'
                                : 'bg-[#F87171]/15 text-[#F87171]'
                            }`}
                          >
                            {t.type === 'CREDIT' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[10px] text-[#A855F7]">
                          {t.category}
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
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold text-sm tabular-nums ${
                            t.type === 'CREDIT' ? 'text-[#34D399]' : 'text-[#F87171]'
                          }`}
                        >
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
        </div>
      )}

      {/* 11.2 Manually Add / Deduct Balance */}
      {submodule === 'adjust' && (
        <form onSubmit={handleManualAdjustment} className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-2xl">
          <div className="border-b border-[#302741] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#34D399]">
              11.2 Manually Add / Deduct User Balance
            </h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">
              Authorized sovereign ledger intervention for reseller top-ups, supplier settlements, or dispute reconciliations
            </p>
          </div>

          {adjustSuccessMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{adjustSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-white font-semibold mb-1">Target Counterparty (Mobile Number / Store)</label>
              <input
                type="text"
                value={targetMobile}
                onChange={(e) => setTargetMobile(e.target.value)}
                placeholder="01XXXXXXXXX or Reseller ID"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-semibold mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-bold"
                >
                  <option value="CREDIT">CREDIT (+ Add Funds)</option>
                  <option value="DEBIT">DEBIT (- Deduct Funds)</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">Amount (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000.00"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-semibold mb-1">Ledger Category</label>
                <select
                  value={adjustCategory}
                  onChange={(e) => setAdjustCategory(e.target.value as any)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                >
                  <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT</option>
                  <option value="DEPOSIT">DIRECT DEPOSIT</option>
                  <option value="COMMISSION">COMMISSION BONUS</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">Secret Super Admin PIN</label>
                <input
                  type="password"
                  value={secretPin}
                  onChange={(e) => setSecretPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">Auditable Reason / Memo</label>
              <textarea
                value={adjustPurpose}
                onChange={(e) => setAdjustPurpose(e.target.value)}
                rows={2}
                placeholder="e.g. Compensated delivery damage payout approved by Super Admin..."
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-white"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={adjusting}
                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg shadow-md"
              >
                {adjusting ? 'Processing Ledger...' : 'Commit Financial Adjustment'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 11.3 Withdrawal Payouts */}
      {submodule === 'withdrawals' && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex items-center justify-between text-xs font-semibold text-white">
            <span>Pending Payout & Disbursement Requests ({withdrawals.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#C9C4D6]">
              <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
                <tr>
                  <th className="px-4 py-3">Request ID & Date</th>
                  <th className="px-4 py-3">Applicant & Role</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Account Details</th>
                  <th className="px-4 py-3 text-right">Amount (BDT)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Disbursement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#302741]">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#C9C4D6]">
                      No withdrawal requests in ledger.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[#100D1B] transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-white">{w.id}</div>
                        <div className="text-[10px] text-[#22D3EE]">{formatBangladeshDateTime(w.requestDate)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{w.userName}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#302741] text-[#A855F7] font-mono">
                          {w.userRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{w.paymentMethod}</td>
                      <td className="px-4 py-3 font-mono text-[#22D3EE]">{w.accountDetails}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white text-sm">
                        {formatBDT(w.requestedAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'PAID'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : w.status === 'REJECTED'
                              ? 'bg-[#F87171]/20 text-[#F87171]'
                              : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setActionWithdrawalId(w.id);
                                setActionType('APPROVE');
                              }}
                              className="px-2.5 py-1 bg-[#34D399] hover:bg-[#10B981] text-black text-[11px] font-bold rounded"
                            >
                              Disburse
                            </button>
                            <button
                              onClick={() => {
                                setActionWithdrawalId(w.id);
                                setActionType('REJECT');
                              }}
                              className="px-2 py-1 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] text-[11px] font-semibold rounded"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-[#C9C4D6]/60">
                            {w.paymentReference ? `Ref: ${w.paymentReference}` : 'CLOSED'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11.4 Payment Gateway Reports */}
      {submodule === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'bKash Merchant Direct', volume: 148500, count: 84, successRate: '99.2%', fee: '1.5%' },
            { name: 'Nagad Business Pay', volume: 92300, count: 52, successRate: '98.8%', fee: '1.2%' },
            { name: 'Cash On Delivery (Steadfast)', volume: 342000, count: 198, successRate: '94.5%', fee: '0.8%' },
            { name: 'City Bank Corporate Transfer', volume: 85000, count: 12, successRate: '100%', fee: '0.0%' },
          ].map((g) => (
            <div key={g.name} className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-2">
              <span className="text-xs font-bold text-white">{g.name}</span>
              <div className="text-xl font-bold text-[#34D399] font-mono">{formatBDT(g.volume)}</div>
              <div className="text-xs text-[#C9C4D6]">Total Transactions: {g.count}</div>
              <div className="text-[11px] flex justify-between text-[#22D3EE] pt-2 border-t border-[#302741]">
                <span>Success Rate: {g.successRate}</span>
                <span>Gateway Fee: {g.fee}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payout Action Dialog Modal */}
      {actionWithdrawalId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {actionType === 'APPROVE' ? 'Confirm Payout Disbursement' : 'Reject Withdrawal Request'}
            </h3>

            <form onSubmit={handleConfirmWithdrawal} className="space-y-3 text-xs">
              {actionType === 'APPROVE' ? (
                <div>
                  <label className="block text-white font-semibold mb-1">
                    Gateway Payout Reference Number (bKash TrxID / Bank UTR)
                  </label>
                  <input
                    type="text"
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="e.g. BK892837192"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-white font-semibold mb-1">Rejection Reason</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. Mismatched account details or pending fraud audit..."
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionWithdrawalId(null)}
                  className="px-4 py-2 text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingWithdrawal}
                  className={`px-5 py-2 font-bold rounded-lg text-white shadow-md ${
                    actionType === 'APPROVE' ? 'bg-[#34D399] text-black hover:bg-[#10B981]' : 'bg-[#F87171] hover:bg-[#DC2626]'
                  }`}
                >
                  {processingWithdrawal ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
