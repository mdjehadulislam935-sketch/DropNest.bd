import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
  Sliders,
  Wallet,
  X,
  XCircle
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';
import type {
  BalanceAdjustmentRecord,
  TransactionIdApprovalItem,
  UserAccountBalance
} from '../../../types/admin.ts';
import type { LedgerTransaction } from '../../../types/platform.ts';

interface AdminAccountModuleProps {
  initialSubmodule?: string;
}

export const AdminAccountModule: React.FC<AdminAccountModuleProps> = ({ initialSubmodule }) => {
  const [activeTab, setActiveTab] = useState<'BALANCES' | 'APPROVALS' | 'HISTORY' | 'STATEMENT'>(() => {
    if (initialSubmodule === 'Transaction ID Approval') return 'APPROVALS';
    if (initialSubmodule === 'Debit & Credit History') return 'HISTORY';
    if (initialSubmodule === 'Statement') return 'STATEMENT';
    return 'BALANCES';
  });

  const [balances, setBalances] = useState<UserAccountBalance[]>([]);
  const [transactions, setTransactions] = useState<TransactionIdApprovalItem[]>([]);
  const [ledgerHistory, setLedgerHistory] = useState<LedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filters
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'RESELLER' | 'SUPPLIER'>('ALL');
  const [balanceSearch, setBalanceSearch] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Modals
  const [selectedUserForAdjustment, setSelectedUserForAdjustment] = useState<UserAccountBalance | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Transaction ID Rejection Modal
  const [rejectingTx, setRejectingTx] = useState<TransactionIdApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewProofTx, setPreviewProofTx] = useState<TransactionIdApprovalItem | null>(null);

  // User details modal
  const [viewUserDetails, setViewUserDetails] = useState<UserAccountBalance | null>(null);

  // Statement Generator State
  const [statementEntity, setStatementEntity] = useState<'PLATFORM' | 'RESELLER' | 'SUPPLIER'>('PLATFORM');
  const [statementData, setStatementData] = useState<any>(null);
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [balRes, txRes, ledgerRes] = await Promise.all([
        ApiService.getAdminBalances(),
        ApiService.getTransactionApprovals(),
        ApiService.getFinancialTransactions(),
      ]);
      setBalances(balRes);
      setTransactions(txRes);
      setLedgerHistory(ledgerRes);
    } catch (err: any) {
      console.error('Failed to load accounts data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAdjustment) return;
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) {
      setFeedback({ text: 'Please enter a valid positive adjustment amount.', isError: true });
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 5) {
      setFeedback({ text: 'Please provide an adjustment reason (min 5 characters).', isError: true });
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const res = await ApiService.adjustAdminBalance({
        userId: selectedUserForAdjustment.userId,
        amount,
        type: adjustType,
        reason: adjustReason.trim(),
      });
      setFeedback({ text: res.message });
      setSelectedUserForAdjustment(null);
      setAdjustAmount('');
      setAdjustReason('');
      loadAllData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Balance adjustment failed.', isError: true });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleApproveTransaction = async (id: string) => {
    try {
      const res = await ApiService.reviewTransactionApproval(id, 'APPROVED');
      setFeedback({ text: res.message });
      loadAllData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Transaction approval failed.', isError: true });
    }
  };

  const handleRejectTransaction = async () => {
    if (!rejectingTx) return;
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setFeedback({ text: 'Rejection reason is required (min 5 characters).', isError: true });
      return;
    }
    try {
      const res = await ApiService.reviewTransactionApproval(rejectingTx.id, 'REJECTED', rejectionReason.trim());
      setFeedback({ text: res.message });
      setRejectingTx(null);
      setRejectionReason('');
      loadAllData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Transaction rejection failed.', isError: true });
    }
  };

  const loadStatement = async () => {
    try {
      const st = await ApiService.getAdminStatement(statementEntity, undefined, statementStartDate, statementEndDate);
      setStatementData(st);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to generate statement.', isError: true });
    }
  };

  useEffect(() => {
    if (activeTab === 'STATEMENT') {
      loadStatement();
    }
  }, [activeTab, statementEntity]);

  const exportStatementCSV = () => {
    if (!statementData || !statementData.transactions) return;
    const headers = ['Transaction ID', 'Date', 'Type', 'Amount (BDT)', 'Purpose', 'User/Source', 'Payment Method', 'Ref', 'Status'];
    const rows = statementData.transactions.map((t: LedgerTransaction) => [
      t.id,
      t.timestamp,
      t.type,
      t.amount,
      `"${t.purpose}"`,
      `"${t.recipientOrSource}"`,
      t.paymentMethod,
      t.referenceNumber,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DropNest_Statement_${statementEntity}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered balances
  const filteredBalances = balances.filter((b) => {
    if (balanceFilter !== 'ALL' && b.accountType !== balanceFilter) return false;
    if (balanceSearch) {
      const q = balanceSearch.toLowerCase();
      return b.userName.toLowerCase().includes(q) || b.mobile.includes(q) || b.district.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (approvalStatusFilter !== 'ALL' && t.status !== approvalStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.isError
              ? 'bg-[#F87171]/10 border-[#F87171]/40 text-[#F87171]'
              : 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {feedback.isError ? <AlertOctagon className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#302741] pb-3">
        <button
          onClick={() => setActiveTab('BALANCES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'BALANCES'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Account Balances ({balances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'APPROVALS'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Transaction ID Approvals ({transactions.filter((t) => t.status === 'PENDING').length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Debit & Credit History</span>
        </button>

        <button
          onClick={() => setActiveTab('STATEMENT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'STATEMENT'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Financial Statement</span>
        </button>
      </div>

      {/* ========================================================
          SUBMODULE 1: ACCOUNT BALANCES
      ======================================================== */}
      {activeTab === 'BALANCES' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl">
              <span className="text-xs text-[#C9C4D6]">Total Available Balances</span>
              <div className="text-lg font-bold text-[#34D399] mt-1">
                {formatBDT(balances.reduce((s, b) => s + b.availableBalance, 0))}
              </div>
              <span className="text-[10px] text-[#C9C4D6]/70 mt-1 block">
                Disbursable funds across all accounts
              </span>
            </div>

            <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl">
              <span className="text-xs text-[#C9C4D6]">Pending Delivery Balances</span>
              <div className="text-lg font-bold text-[#FBBF24] mt-1">
                {formatBDT(balances.reduce((s, b) => s + b.pendingBalance, 0))}
              </div>
              <span className="text-[10px] text-[#C9C4D6]/70 mt-1 block">
                Not accessible until courier confirms delivery
              </span>
            </div>

            <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl">
              <span className="text-xs text-[#C9C4D6]">Active Accounts</span>
              <div className="text-lg font-bold text-white mt-1">
                {balances.length} Merchants
              </div>
              <span className="text-[10px] text-[#22D3EE] mt-1 block">
                {balances.filter((b) => b.accountType === 'RESELLER').length} Resellers · {balances.filter((b) => b.accountType === 'SUPPLIER').length} Suppliers
              </span>
            </div>
          </div>

          {/* Table Filters */}
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#C9C4D6]" />
                <input
                  type="text"
                  placeholder="Search by name, phone, district..."
                  value={balanceSearch}
                  onChange={(e) => setBalanceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#100D1B] p-1 rounded-xl border border-[#302741]">
                {(['ALL', 'RESELLER', 'SUPPLIER'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setBalanceFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      balanceFilter === type
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-[#C9C4D6] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => loadAllData()}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Balances Table */}
          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-4">Merchant Name & ID</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Contact & Location</th>
                    <th className="py-3 px-4 text-right">Available Balance</th>
                    <th className="py-3 px-4 text-right">Pending Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#C9C4D6]">
                        No matching merchant accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredBalances.map((item) => (
                      <tr key={item.userId} className="hover:bg-[#1A142B] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{item.userName}</div>
                          <div className="font-mono text-[10px] text-[#C9C4D6]/70">{item.userId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.accountType === 'RESELLER'
                                ? 'bg-[#7C3AED]/20 text-[#A855F7]'
                                : 'bg-[#22D3EE]/20 text-[#22D3EE]'
                            }`}
                          >
                            {item.accountType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#C9C4D6]">
                          <div>{item.mobile}</div>
                          <div className="text-[10px] text-[#C9C4D6]/70">
                            {item.upazila}, {item.district}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#34D399]">
                          {formatBDT(item.availableBalance)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#FBBF24]">
                          {formatBDT(item.pendingBalance)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#34D399]/20 text-[#34D399]">
                            {item.accountStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setViewUserDetails(item)}
                            className="px-2.5 py-1 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-[#C9C4D6] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForAdjustment(item);
                              setAdjustAmount('');
                              setAdjustReason('');
                            }}
                            className="px-2.5 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Adjust Balance
                          </button>
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

      {/* ========================================================
          SUBMODULE 2: TRANSACTION ID APPROVALS
      ======================================================== */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-4">
          {/* Duplicate Detection Alert Notice */}
          <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Automated Duplicate Transaction ID Guard</div>
                <div className="text-[#C9C4D6]">
                  Every approved Transaction ID is cross-checked against the sovereign ledger. Duplicate IDs are automatically blocked from multiple account credits.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setApprovalStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    approvalStatusFilter === st
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-[#100D1B] text-[#C9C4D6] hover:text-white border border-[#302741]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-4">Submission Ref</th>
                    <th className="py-3 px-4">Merchant Name & Role</th>
                    <th className="py-3 px-4">Method & TrxID</th>
                    <th className="py-3 px-4 text-right">Amount (BDT)</th>
                    <th className="py-3 px-4">Sender Info</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#C9C4D6]">
                        No transactions found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#1A142B] transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">
                          <div>{tx.id}</div>
                          <div className="text-[10px] text-[#C9C4D6]/70">
                            {formatBangladeshDateTime(tx.requestDate)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{tx.userName}</div>
                          <div className="text-[10px] text-[#A855F7] font-semibold">{tx.userRole} · {tx.userMobile}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#22D3EE]">{tx.paymentMethod}</div>
                          <div className="font-mono text-xs text-white">{tx.transactionId}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#34D399]">
                          {formatBDT(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#C9C4D6]">
                          <div>{tx.senderInfo}</div>
                          <button
                            onClick={() => setPreviewProofTx(tx)}
                            className="text-[10px] text-[#7C3AED] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Proof</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === 'APPROVED'
                                ? 'bg-[#34D399]/20 text-[#34D399]'
                                : tx.status === 'REJECTED'
                                ? 'bg-[#F87171]/20 text-[#F87171]'
                                : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {tx.status === 'PENDING' || tx.status === 'UNDER_REVIEW' ? (
                            <>
                              <button
                                onClick={() => handleApproveTransaction(tx.id)}
                                className="px-3 py-1 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingTx(tx);
                                  setRejectionReason('');
                                }}
                                className="px-3 py-1 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#C9C4D6]/60 italic">
                              Reviewed by {tx.reviewedBy || 'Admin'}
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
        </div>
      )}

      {/* ========================================================
          SUBMODULE 3: DEBIT & CREDIT HISTORY
      ======================================================== */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Full Transaction Audit Ledger</h3>
              <p className="text-xs text-[#C9C4D6]">
                Showing complete record of all platform deposits, payouts, manual adjustments and orders.
              </p>
            </div>
            <button
              onClick={() => loadAllData()}
              className="px-3 py-1.5 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-4">Transaction ID & Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Party / Source</th>
                    <th className="py-3 px-4">Method & Ref</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4 text-right">Amount (BDT)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {ledgerHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#C9C4D6]">
                        No ledger history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerHistory.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#1A142B] transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <div>{tx.id}</div>
                          <div className="text-[10px] text-[#C9C4D6]/70">
                            {formatBangladeshDateTime(tx.timestamp)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'CREDIT'
                                ? 'bg-[#34D399]/20 text-[#34D399]'
                                : 'bg-[#F87171]/20 text-[#F87171]'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-white">{tx.recipientOrSource}</div>
                          {tx.userRole && <div className="text-[10px] text-[#A855F7]">{tx.userRole}</div>}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#C9C4D6]">
                          <div>{tx.paymentMethod}</div>
                          <div className="font-mono text-[10px] text-[#22D3EE]">{tx.referenceNumber}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#C9C4D6] max-w-xs truncate">
                          {tx.purpose}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            tx.type === 'CREDIT' ? 'text-[#34D399]' : 'text-[#F87171]'
                          }`}
                        >
                          {tx.type === 'CREDIT' ? '+' : '-'} {formatBDT(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34D399]/20 text-[#34D399]">
                            {tx.status}
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

      {/* ========================================================
          SUBMODULE 4: FINANCIAL STATEMENT
      ======================================================== */}
      {activeTab === 'STATEMENT' && (
        <div className="space-y-4">
          {/* Controls & Export */}
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div>
                <label className="block text-[10px] text-[#C9C4D6] font-semibold mb-1">Entity Scope</label>
                <div className="flex items-center gap-1 bg-[#100D1B] p-1 rounded-xl border border-[#302741]">
                  {(['PLATFORM', 'RESELLER', 'SUPPLIER'] as const).map((ent) => (
                    <button
                      key={ent}
                      onClick={() => setStatementEntity(ent)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        statementEntity === ent ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
                      }`}
                    >
                      {ent}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#C9C4D6] font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={statementStartDate}
                  onChange={(e) => setStatementStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#C9C4D6] font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={statementEndDate}
                  onChange={(e) => setStatementEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={loadStatement}
                className="mt-4 px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all"
              >
                Filter
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportStatementCSV}
                className="px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-[#34D399]" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-[#22D3EE]" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* Statement Overview Cards */}
          {statementData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl">
                <span className="text-[10px] text-[#C9C4D6]">Opening Balance</span>
                <div className="text-base font-bold text-white mt-1">
                  {formatBDT(statementData.openingBalance)}
                </div>
              </div>

              <div className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl">
                <span className="text-[10px] text-[#C9C4D6]">Total Credit Inflow</span>
                <div className="text-base font-bold text-[#34D399] mt-1">
                  + {formatBDT(statementData.totalCredit)}
                </div>
              </div>

              <div className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl">
                <span className="text-[10px] text-[#C9C4D6]">Total Debit Outflow</span>
                <div className="text-base font-bold text-[#F87171] mt-1">
                  - {formatBDT(statementData.totalDebit)}
                </div>
              </div>

              <div className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl">
                <span className="text-[10px] text-[#C9C4D6]">Net Financial Result</span>
                <div
                  className={`text-base font-bold mt-1 ${
                    statementData.netBalance >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'
                  }`}
                >
                  {formatBDT(statementData.netBalance)}
                </div>
              </div>

              <div className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl">
                <span className="text-[10px] text-[#C9C4D6]">Closing Balance</span>
                <div className="text-base font-bold text-[#22D3EE] mt-1">
                  {formatBDT(statementData.closingBalance)}
                </div>
              </div>
            </div>
          )}

          {/* Statement Table */}
          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-[#100D1B] border-b border-[#302741] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Official Statement Ledger · DropNest BD
                </span>
                <span className="text-[10px] text-[#C9C4D6] block">
                  Generated on {formatBangladeshDateTime(new Date())}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Trx ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Source / Beneficiary</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4 text-right">Debit (BDT)</th>
                    <th className="py-3 px-4 text-right">Credit (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {!statementData || !statementData.transactions || statementData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#C9C4D6]">
                        No statement records available for this query.
                      </td>
                    </tr>
                  ) : (
                    statementData.transactions.map((tx: LedgerTransaction) => (
                      <tr key={tx.id} className="hover:bg-[#1A142B] transition-colors">
                        <td className="py-3 px-4 text-xs text-[#C9C4D6]">
                          {formatBangladeshDateTime(tx.timestamp)}
                        </td>
                        <td className="py-3 px-4 font-mono">{tx.id}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'CREDIT' ? 'bg-[#34D399]/20 text-[#34D399]' : 'bg-[#F87171]/20 text-[#F87171]'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">{tx.recipientOrSource}</td>
                        <td className="py-3 px-4 text-xs text-[#C9C4D6] max-w-xs truncate">{tx.purpose}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#F87171]">
                          {tx.type === 'DEBIT' ? formatBDT(tx.amount) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#34D399]">
                          {tx.type === 'CREDIT' ? formatBDT(tx.amount) : '-'}
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

      {/* ========================================================
          MODAL 1: BALANCE ADJUSTMENT
      ======================================================== */}
      {selectedUserForAdjustment && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#171226] border border-[#7C3AED]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Adjust Account Balance</h3>
                <p className="text-xs text-[#C9C4D6]">
                  {selectedUserForAdjustment.userName} ({selectedUserForAdjustment.accountType})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAdjustment(null)}
                className="p-1 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Current Available Balance:</span>
                <span className="font-bold text-[#34D399]">{formatBDT(selectedUserForAdjustment.availableBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Pending Delivery Balance:</span>
                <span className="font-bold text-[#FBBF24]">{formatBDT(selectedUserForAdjustment.pendingBalance)}</span>
              </div>
              <div className="text-[10px] text-[#C9C4D6]/70 mt-1 italic">
                * Pending balance cannot be converted to available balance without courier delivery confirmation.
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('CREDIT')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'CREDIT'
                        ? 'bg-[#34D399] text-black border-[#34D399]'
                        : 'bg-[#100D1B] text-[#C9C4D6] border-[#302741]'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Credit (Add Funds)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('DEBIT')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'DEBIT'
                        ? 'bg-[#F87171] text-white border-[#F87171]'
                        : 'bg-[#100D1B] text-[#C9C4D6] border-[#302741]'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Debit (Deduct Funds)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Adjustment Amount (BDT ৳)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 5000"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Mandatory Operational Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the audit reason for this manual balance adjustment (e.g., promotional incentive, shipping deposit correction)..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForAdjustment(null)}
                  className="flex-1 py-2.5 bg-[#100D1B] hover:bg-[#1E1733] border border-[#302741] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="flex-1 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmittingAdjust ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Confirm Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: TRANSACTION REJECTION REASON
      ======================================================== */}
      {rejectingTx && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#171226] border border-[#F87171]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F87171]">Reject Transaction ID</h3>
                <p className="text-xs text-[#C9C4D6]">
                  Trx #{rejectingTx.transactionId} ({rejectingTx.paymentMethod}) for {rejectingTx.userName}
                </p>
              </div>
              <button
                onClick={() => setRejectingTx(null)}
                className="p-1 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Reason for Rejection (Mandatory)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify why this transaction ID is invalid (e.g. MFS statement mismatch, incorrect sender wallet, amount discrepancy)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#F87171]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectingTx(null)}
                className="flex-1 py-2 bg-[#100D1B] border border-[#302741] text-xs font-bold text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTransaction}
                className="flex-1 py-2 bg-[#F87171] hover:bg-[#EF4444] text-xs font-bold text-white rounded-xl transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: PAYMENT PROOF PREVIEW
      ======================================================== */}
      {previewProofTx && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Payment Proof Document</h3>
                <p className="text-xs text-[#22D3EE] font-mono">
                  {previewProofTx.paymentMethod} · TrxID #{previewProofTx.transactionId}
                </p>
              </div>
              <button
                onClick={() => setPreviewProofTx(null)}
                className="p-1 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#100D1B] border border-[#302741] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Deposit Amount:</span>
                <span className="font-bold text-[#34D399]">{formatBDT(previewProofTx.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Sender Account / Wallet:</span>
                <span className="font-mono text-white">{previewProofTx.senderInfo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Proof Summary:</span>
                <span className="text-white">{previewProofTx.paymentProof}</span>
              </div>
            </div>

            <div className="h-48 rounded-xl bg-[#0D0A17] border border-[#302741] flex flex-col items-center justify-center text-center p-4">
              <CreditCard className="w-10 h-10 text-[#7C3AED] mb-2" />
              <span className="text-xs font-semibold text-white">Verified Digital Payment Receipt</span>
              <span className="text-[10px] text-[#C9C4D6]/70 mt-1">
                Authenticated via Bangladesh Bank EFTN / MFS Gateway Provider
              </span>
            </div>

            <button
              onClick={() => setPreviewProofTx(null)}
              className="w-full py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-bold text-white rounded-xl transition-colors"
            >
              Close Proof
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: USER DETAILS
      ======================================================== */}
      {viewUserDetails && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Account Dossier</h3>
                <p className="text-xs text-[#A855F7] font-semibold">{viewUserDetails.userName}</p>
              </div>
              <button
                onClick={() => setViewUserDetails(null)}
                className="p-1 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-[#100D1B] rounded-lg">
                <span className="text-[#C9C4D6]">User ID:</span>
                <span className="font-mono text-white">{viewUserDetails.userId}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#100D1B] rounded-lg">
                <span className="text-[#C9C4D6]">Mobile Number:</span>
                <span className="font-mono text-[#22D3EE]">{viewUserDetails.mobile}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#100D1B] rounded-lg">
                <span className="text-[#C9C4D6]">Account Role:</span>
                <span className="font-semibold text-[#A855F7]">{viewUserDetails.accountType}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#100D1B] rounded-lg">
                <span className="text-[#C9C4D6]">Operating Location:</span>
                <span className="text-white">{viewUserDetails.upazila}, {viewUserDetails.district}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#100D1B] rounded-lg">
                <span className="text-[#C9C4D6]">Available Balance:</span>
                <span className="font-bold text-[#34D399]">{formatBDT(viewUserDetails.availableBalance)}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#100D1B] rounded-lg">
                <span className="text-[#C9C4D6]">Pending Balance:</span>
                <span className="font-bold text-[#FBBF24]">{formatBDT(viewUserDetails.pendingBalance)}</span>
              </div>
              <div className="flex justify-between p-2 bg-[#100D1B] rounded-lg">
                <span className="text-[#C9C4D6]">Last Activity:</span>
                <span className="text-[#C9C4D6]">{formatBangladeshDateTime(viewUserDetails.lastTransactionDate)}</span>
              </div>
            </div>

            <button
              onClick={() => setViewUserDetails(null)}
              className="w-full py-2 bg-[#100D1B] hover:bg-[#1E1733] border border-[#302741] text-xs font-bold text-white rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
