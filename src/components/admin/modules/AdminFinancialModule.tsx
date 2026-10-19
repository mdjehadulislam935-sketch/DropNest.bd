import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Layers,
  PauseCircle,
  PlusCircle,
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
  AdminFinancialMetrics,
  ResellerPayoutItem,
  SupplierSettlementItem,
  UserAccountBalance
} from '../../../types/admin.ts';

interface AdminFinancialModuleProps {
  initialSubmodule?: string;
}

export const AdminFinancialModule: React.FC<AdminFinancialModuleProps> = ({ initialSubmodule }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PAYOUTS' | 'SUPPLIERS' | 'MANUAL'>(() => {
    if (initialSubmodule === 'Reseller Payouts') return 'PAYOUTS';
    if (initialSubmodule === 'Supplier Settlements') return 'SUPPLIERS';
    if (initialSubmodule === 'Manual Entry') return 'MANUAL';
    return 'DASHBOARD';
  });

  const [finances, setFinances] = useState<AdminFinancialMetrics | null>(null);
  const [payouts, setPayouts] = useState<ResellerPayoutItem[]>([]);
  const [settlements, setSettlements] = useState<SupplierSettlementItem[]>([]);
  const [balances, setBalances] = useState<UserAccountBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Payout Rejection Modal
  const [rejectingPayout, setRejectingPayout] = useState<ResellerPayoutItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Manual Transaction Form
  const [manualUserId, setManualUserId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [manualMethod, setManualMethod] = useState('BRAC Bank Corporate Transfer');
  const [manualPurpose, setManualPurpose] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Time Range for chart
  const [chartView, setChartView] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [finRes, payRes, stlRes, balRes] = await Promise.all([
        ApiService.getAdminFinancesOverview(),
        ApiService.getResellerPayouts(),
        ApiService.getSupplierSettlements(),
        ApiService.getAdminBalances(),
      ]);
      setFinances(finRes);
      setPayouts(payRes);
      setSettlements(stlRes);
      setBalances(balRes);
    } catch (err: any) {
      console.error('Failed to load financial module data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprovePayout = async (id: string) => {
    try {
      const res = await ApiService.reviewResellerPayout(id, 'APPROVED');
      setFeedback({ text: res.message });
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Payout approval failed', isError: true });
    }
  };

  const handleHoldPayout = async (id: string) => {
    try {
      const res = await ApiService.reviewResellerPayout(id, 'ON_HOLD', 'Under compliance audit');
      setFeedback({ text: res.message });
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Action failed', isError: true });
    }
  };

  const handleRejectPayout = async () => {
    if (!rejectingPayout) return;
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setFeedback({ text: 'Rejection reason is required (minimum 5 characters).', isError: true });
      return;
    }
    try {
      const res = await ApiService.reviewResellerPayout(rejectingPayout.id, 'REJECTED', rejectionReason.trim());
      setFeedback({ text: res.message });
      setRejectingPayout(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Payout rejection failed', isError: true });
    }
  };

  const handleSettleSupplier = async (id: string) => {
    try {
      const res = await ApiService.reviewSupplierSettlement(id, 'SETTLED');
      setFeedback({ text: res.message });
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Settlement failed', isError: true });
    }
  };

  const handleHoldSupplier = async (id: string) => {
    try {
      const res = await ApiService.reviewSupplierSettlement(id, 'HELD');
      setFeedback({ text: res.message });
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Hold action failed', isError: true });
    }
  };

  const handleManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId) {
      setFeedback({ text: 'Please select a recipient merchant account.', isError: true });
      return;
    }
    const amt = Number(manualAmount);
    if (!amt || amt <= 0) {
      setFeedback({ text: 'Amount must be greater than zero.', isError: true });
      return;
    }
    if (!manualPurpose || manualPurpose.trim().length < 5) {
      setFeedback({ text: 'Please state the manual entry purpose (min 5 characters).', isError: true });
      return;
    }

    setIsSubmittingManual(true);
    try {
      const res = await ApiService.adjustAdminBalance({
        userId: manualUserId,
        amount: amt,
        type: manualType,
        reason: `${manualPurpose.trim()} (Ref: ${manualRef || 'MANUAL-DN'})`,
      });
      setFeedback({ text: res.message });
      setManualUserId('');
      setManualAmount('');
      setManualPurpose('');
      setManualRef('');
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Manual entry failed', isError: true });
    } finally {
      setIsSubmittingManual(false);
    }
  };

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

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#302741] pb-3">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DASHBOARD'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Financial Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('PAYOUTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PAYOUTS'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Reseller Payouts ({payouts.filter((p) => p.status === 'PENDING').length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'SUPPLIERS'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Supplier Settlements</span>
        </button>

        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'MANUAL'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
              : 'bg-[#171226] text-[#C9C4D6] hover:bg-[#1E1733] hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Transaction Entry</span>
        </button>
      </div>

      {/* ========================================================
          SUBMODULE 1: FINANCIAL DASHBOARD & TRENDS
      ======================================================== */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl">
              <span className="text-xs text-[#C9C4D6]">Platform Total Income</span>
              <div className="text-xl font-bold text-[#34D399] mt-1">
                {formatBDT(finances?.totalIncome || 500000)}
              </div>
              <span className="text-[10px] text-[#C9C4D6]/70 mt-1 block">Accumulated gross credit inflow</span>
            </div>

            <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl">
              <span className="text-xs text-[#C9C4D6]">Total Expenses & Outflow</span>
              <div className="text-xl font-bold text-[#F87171] mt-1">
                {formatBDT(finances?.totalExpense || 45000)}
              </div>
              <span className="text-[10px] text-[#C9C4D6]/70 mt-1 block">Payouts, shipping and logistics fees</span>
            </div>

            <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl">
              <span className="text-xs text-[#C9C4D6]">Pending Reseller Payouts</span>
              <div className="text-xl font-bold text-[#FBBF24] mt-1">
                {formatBDT(finances?.pendingPayout || 35000)}
              </div>
              <span className="text-[10px] text-[#C9C4D6]/70 mt-1 block">Awaiting admin review</span>
            </div>

            <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl">
              <span className="text-xs text-[#C9C4D6]">Reserve Liquidity Fund</span>
              <div className="text-xl font-bold text-[#22D3EE] mt-1">
                {formatBDT(finances?.reserveFund || 200000)}
              </div>
              <span className="text-[10px] text-[#C9C4D6]/70 mt-1 block">Sovereign settlement reserve</span>
            </div>
          </div>

          {/* Graphical Transaction Trend Chart (Visual SVG) */}
          <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#7C3AED]" />
                  <span>Transaction Volume Trend (Daily & Weekly)</span>
                </h3>
                <p className="text-xs text-[#C9C4D6]">
                  Real-time monetary movement across deposits, merchant recharges, and payouts in BDT.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-[#100D1B] p-1 rounded-xl border border-[#302741]">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setChartView(view)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      chartView === view ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Bar & Line Representation */}
            <div className="h-64 bg-[#100D1B] border border-[#302741] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#C9C4D6] border-b border-[#302741]/50 pb-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#34D399]" />
                    <span>Credit Inflow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#F87171]" />
                    <span>Debit Outflow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#22D3EE]" />
                    <span>Net Balance</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#C9C4D6]/70">Values in BDT (৳)</span>
              </div>

              {/* Chart Bars */}
              <div className="flex-1 flex items-end justify-between gap-3 pt-6 pb-2">
                {(finances?.chartData || [
                  { label: 'Sat', credit: 48000, debit: 22000, net: 26000 },
                  { label: 'Sun', credit: 62000, debit: 34000, net: 28000 },
                  { label: 'Mon', credit: 75000, debit: 41000, net: 34000 },
                  { label: 'Tue', credit: 59000, debit: 28000, net: 31000 },
                  { label: 'Wed', credit: 88000, debit: 52000, net: 36000 },
                  { label: 'Thu', credit: 94000, debit: 48000, net: 46000 },
                  { label: 'Fri', credit: 67000, debit: 31000, net: 36000 },
                ]).map((bar) => {
                  const maxVal = 100000;
                  const creditH = Math.min(100, Math.round((bar.credit / maxVal) * 100));
                  const debitH = Math.min(100, Math.round((bar.debit / maxVal) * 100));

                  return (
                    <div key={bar.label} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        <div
                          style={{ height: `${creditH}%` }}
                          className="w-1/2 max-w-[14px] bg-[#34D399] rounded-t-sm transition-all group-hover:brightness-110"
                          title={`Credit: ৳${bar.credit}`}
                        />
                        <div
                          style={{ height: `${debitH}%` }}
                          className="w-1/2 max-w-[14px] bg-[#F87171] rounded-t-sm transition-all group-hover:brightness-110"
                          title={`Debit: ৳${bar.debit}`}
                        />
                      </div>
                      <span className="text-[10px] text-[#C9C4D6] font-medium">{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBMODULE 2: RESELLER PAYOUT REQUESTS
      ======================================================== */}
      {activeTab === 'PAYOUTS' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Reseller Profit Withdrawal Requests</h3>
              <p className="text-xs text-[#C9C4D6]">
                Review and approve withdrawal requests from resellers to their bKash, Nagad, Rocket or Bank accounts.
              </p>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3 py-1.5 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-4">Payout Ref & Date</th>
                    <th className="py-3 px-4">Reseller Name</th>
                    <th className="py-3 px-4 text-right">Available Profit</th>
                    <th className="py-3 px-4 text-right">Requested Amount</th>
                    <th className="py-3 px-4">MFS / Bank Account</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#C9C4D6]">
                        No payout requests found.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((item) => (
                      <tr key={item.id} className="hover:bg-[#1A142B] transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <div>{item.id}</div>
                          <div className="text-[10px] text-[#C9C4D6]/70">
                            {formatBangladeshDateTime(item.requestDate)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{item.resellerName}</div>
                          <div className="text-[10px] text-[#22D3EE] font-mono">{item.resellerMobile}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#34D399]">
                          {formatBDT(item.availableProfitBalance)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {formatBDT(item.requestedAmount)}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-[#A855F7]">{item.paymentMethod}</div>
                          <div className="font-mono text-[#C9C4D6] text-[10px]">{item.accountNumber}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'APPROVED'
                                ? 'bg-[#34D399]/20 text-[#34D399]'
                                : item.status === 'REJECTED'
                                ? 'bg-[#F87171]/20 text-[#F87171]'
                                : item.status === 'ON_HOLD'
                                ? 'bg-[#22D3EE]/20 text-[#22D3EE]'
                                : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {item.status === 'PENDING' || item.status === 'ON_HOLD' ? (
                            <>
                              <button
                                onClick={() => handleApprovePayout(item.id)}
                                className="px-2.5 py-1 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleHoldPayout(item.id)}
                                className="px-2 py-1 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-[#22D3EE] text-xs font-semibold rounded-lg transition-colors"
                              >
                                Hold
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingPayout(item);
                                  setRejectionReason('');
                                }}
                                className="px-2.5 py-1 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#C9C4D6]/60 italic">
                              Processed ({item.processedBy || 'Admin'})
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
          SUBMODULE 3: SUPPLIER SETTLEMENTS
      ======================================================== */}
      {activeTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#171226] border border-[#302741] rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Supplier Sales Settlements</h3>
              <p className="text-xs text-[#C9C4D6]">
                Automated calculation of wholesale base prices for delivered orders ready for corporate settlement.
              </p>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3 py-1.5 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-4">Settlement Batch</th>
                    <th className="py-3 px-4">Supplier Merchant</th>
                    <th className="py-3 px-4 text-center">Delivered Orders</th>
                    <th className="py-3 px-4 text-right">Payable Amount</th>
                    <th className="py-3 px-4">Corporate Account Details</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {settlements.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1A142B] transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div>{item.id}</div>
                        <div className="text-[10px] text-[#C9C4D6]/70">
                          {formatBangladeshDateTime(item.requestDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.supplierName}</div>
                        <div className="text-[10px] text-[#22D3EE] font-mono">{item.supplierMobile}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {item.totalDeliveredOrders} Orders
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#34D399]">
                        {formatBDT(item.payableAmount)}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#C9C4D6]">
                        <div>{item.paymentMethod}</div>
                        <div className="text-[10px] text-[#C9C4D6]/70">{item.accountDetails}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.settlementStatus === 'SETTLED'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : item.settlementStatus === 'HELD'
                              ? 'bg-[#F87171]/20 text-[#F87171]'
                              : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                          }`}
                        >
                          {item.settlementStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {item.settlementStatus === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleSettleSupplier(item.id)}
                              className="px-3 py-1 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors"
                            >
                              Settle Batch
                            </button>
                            <button
                              onClick={() => handleHoldSupplier(item.id)}
                              className="px-3 py-1 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-[#F87171] text-xs font-semibold rounded-lg transition-colors"
                            >
                              Hold
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-[#C9C4D6]/60 italic">
                            Disbursed by {item.settledBy || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBMODULE 4: MANUAL TRANSACTION ENTRY
      ======================================================== */}
      {activeTab === 'MANUAL' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-2xl max-w-xl mx-auto space-y-5 shadow-2xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#7C3AED]" />
              <span>Manual Financial Ledger Entry</span>
            </h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">
              Authorized manual debit or credit operation. Every transaction creates an immutable audit trail with Admin ID.
            </p>
          </div>

          <form onSubmit={handleManualTransaction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Target Merchant Account</label>
              <select
                required
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="">Select Reseller or Supplier</option>
                {balances.map((b) => (
                  <option key={b.userId} value={b.userId}>
                    {b.userName} ({b.accountType}) — Available: ৳{b.availableBalance}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Transaction Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="CREDIT">Credit (+) Add to Balance</option>
                  <option value="DEBIT">Debit (-) Deduct from Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Amount (BDT ৳)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 10000"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Payment Method / Gateway</label>
                <input
                  type="text"
                  required
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Reference ID / Slip Number</label>
                <input
                  type="text"
                  placeholder="e.g. BRAC-MANUAL-0091"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Mandatory Operational Purpose</label>
              <textarea
                rows={3}
                required
                placeholder="Detailed reason for manual ledger transaction entry..."
                value={manualPurpose}
                onChange={(e) => setManualPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingManual}
              className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#7C3AED]/20 flex items-center justify-center gap-2"
            >
              {isSubmittingManual ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>Execute Manual Transaction</span>
            </button>
          </form>
        </div>
      )}

      {/* Payout Rejection Modal */}
      {rejectingPayout && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#171226] border border-[#F87171]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F87171]">Reject Reseller Payout</h3>
                <p className="text-xs text-[#C9C4D6]">
                  {rejectingPayout.resellerName} · BDT {rejectingPayout.requestedAmount}
                </p>
              </div>
              <button
                onClick={() => setRejectingPayout(null)}
                className="p-1 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Reason for Rejection (Will be sent to Reseller Notification)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify rejection reason (e.g., incorrect MFS wallet number, minimum payout threshold not met)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white focus:outline-none focus:border-[#F87171]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectingPayout(null)}
                className="flex-1 py-2 bg-[#100D1B] border border-[#302741] text-xs font-bold text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayout}
                className="flex-1 py-2 bg-[#F87171] hover:bg-[#EF4444] text-xs font-bold text-white rounded-xl transition-colors"
              >
                Confirm Rejection & Refund Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
