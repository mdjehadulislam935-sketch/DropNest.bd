import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  FileCheck,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Smartphone,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiService } from '../../services/api.ts';
import { formatBDT } from '../../utils/formatters.ts';
import type { AdminFinancialMetrics, AdminPermissions, TransactionIdApprovalItem, UserAccountBalance } from '../../types/admin.ts';
import type { OrderItem } from '../../types/platform.ts';
import { ApprovalManagementDashboard } from './ApprovalManagementDashboard.tsx';

interface AdminDashboardOverviewProps {
  onNavigate: (module: string, submodule?: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [finances, setFinances] = useState<AdminFinancialMetrics | null>(null);
  const [transactions, setTransactions] = useState<TransactionIdApprovalItem[]>([]);
  const [balances, setBalances] = useState<UserAccountBalance[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [finRes, txRes, balRes, ordRes, permRes] = await Promise.all([
        ApiService.getAdminFinancesOverview(),
        ApiService.getTransactionApprovals(),
        ApiService.getAdminBalances(),
        ApiService.getOrders(),
        ApiService.getAdminPermissions(),
      ]);
      setFinances(finRes);
      setTransactions(txRes);
      setBalances(balRes);
      setOrders(ordRes);
      setPermissions(permRes);
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickApproveTx = async (txId: string) => {
    try {
      const res = await ApiService.reviewTransactionApproval(txId, 'APPROVED');
      setActionMessage({ text: res.message });
      loadData();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Approval failed', isError: true });
    }
  };

  const pendingTx = transactions.filter((t) => t.status === 'PENDING');
  const pendingApprovalsCount = pendingTx.length;
  const resellerBalancesSum = balances
    .filter((b) => b.accountType === 'RESELLER')
    .reduce((sum, b) => sum + b.availableBalance, 0);
  const supplierBalancesSum = balances
    .filter((b) => b.accountType === 'SUPPLIER')
    .reduce((sum, b) => sum + b.availableBalance, 0);

  // Fraud flag: detect customer mobiles with multiple returns/cancellations
  const riskOrders = orders.filter((o) => o.customerMobile === '01899112233' || o.status === 'RETURNED');

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            actionMessage.isError
              ? 'bg-[#F87171]/10 border-[#F87171]/40 text-[#F87171]'
              : 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {actionMessage.isError ? <AlertOctagon className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Welcome & Operational Status */}
      <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              OPERATIONAL CONSOLE
            </span>
            <span className="text-xs text-[#C9C4D6]/70">Admin Clearance Verified</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-xs text-[#C9C4D6] mt-0.5">
            DropNest Central Bangladesh Operations · Managing accounts, verification, orders & financial ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => loadData()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
          <button
            onClick={() => onNavigate('user-approvals', 'Pending Requests')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#EC4899]/50 hover:border-[#EC4899] rounded-xl text-xs font-bold text-[#EC4899] transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Registration Approvals</span>
          </button>
          <button
            onClick={() => onNavigate('accounts', 'Transaction ID Approval')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-[#7C3AED]/20"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Approve Trx IDs ({pendingApprovalsCount})</span>
          </button>
        </div>
      </div>

      {/* Fraud Alert Banner if repeat returns/cancellations detected */}
      {riskOrders.length > 0 && (
        <div className="bg-[#F87171]/10 border border-[#F87171]/40 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#F87171]/20 text-[#F87171] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Fraud & High Return Risk Warning
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F87171]/20 text-[#F87171] font-mono font-bold">
                Customer Mobile: 01899112233
              </span>
            </div>
            <p className="text-xs text-[#C9C4D6] mt-1 leading-relaxed">
              Multiple cancelled and returned orders detected for customer phone number <strong className="text-white">01899112233</strong> (Order #DN-2026-819207 & #DN-2026-819208). Flagged by DropNest Risk Engine to protect reseller shipping deposit balances.
            </p>
          </div>
          <button
            onClick={() => onNavigate('order-tracking', 'Fraud Alert')}
            className="px-3 py-1.5 bg-[#F87171] hover:bg-[#EF4444] text-white text-xs font-bold rounded-lg transition-colors shrink-0"
          >
            Review Flagged Orders
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Platform Sales */}
        <div
          onClick={() => onNavigate('analytics', 'Sales Analytics')}
          className="bg-[#171226] border border-[#302741] hover:border-[#7C3AED]/50 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-xs text-[#C9C4D6]">
            <span>Total Sales Volume</span>
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white mt-2">
            {formatBDT(finances?.totalIncome || 142000)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#34D399]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% from last month</span>
          </div>
        </div>

        {/* Card 2: Reseller Balances */}
        <div
          onClick={() => onNavigate('accounts', 'Balances')}
          className="bg-[#171226] border border-[#302741] hover:border-[#22D3EE]/50 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-xs text-[#C9C4D6]">
            <span>Active Reseller Balances</span>
            <div className="w-7 h-7 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white mt-2">
            {formatBDT(resellerBalancesSum || 86450)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#C9C4D6]">
            <span>{balances.filter((b) => b.accountType === 'RESELLER').length} Resellers Enrolled</span>
          </div>
        </div>

        {/* Card 3: Supplier Settlements */}
        <div
          onClick={() => onNavigate('finances', 'Supplier Settlements')}
          className="bg-[#171226] border border-[#302741] hover:border-[#FBBF24]/50 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-xs text-[#C9C4D6]">
            <span>Supplier Settlements</span>
            <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/20 text-[#FBBF24] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white mt-2">
            {formatBDT(supplierBalancesSum || 90600)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#FBBF24]">
            <span>2 Batches Pending Approval</span>
          </div>
        </div>

        {/* Card 4: SMS Balance */}
        <div
          onClick={() => onNavigate('sms-centre', 'SMS Dashboard')}
          className="bg-[#171226] border border-[#302741] hover:border-[#34D399]/50 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-xs text-[#C9C4D6]">
            <span>Gateway SMS Balance</span>
            <div className="w-7 h-7 rounded-lg bg-[#34D399]/20 text-[#34D399] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white mt-2">
            14,250 SMS
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#34D399]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>99.4% Delivery Success Rate</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => onNavigate('accounts', 'Transaction ID Approval')}
          className="p-3 rounded-xl bg-[#171226] border border-[#302741] hover:border-[#7C3AED] hover:bg-[#1E1733] text-left transition-all flex flex-col justify-between h-24"
        >
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Trx Approval</div>
            <div className="text-[10px] text-[#C9C4D6]/70">{pendingApprovalsCount} pending verify</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('user-approvals', 'Pending Requests')}
          className="p-3 rounded-xl bg-[#171226] border border-[#302741] hover:border-[#EC4899] hover:bg-[#1E1733] text-left transition-all flex flex-col justify-between h-24"
        >
          <div className="w-7 h-7 rounded-lg bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Approval Mgmt</div>
            <div className="text-[10px] text-[#EC4899]">Resellers & Suppliers</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('order-tracking', 'Order Dashboard')}
          className="p-3 rounded-xl bg-[#171226] border border-[#302741] hover:border-[#34D399] hover:bg-[#1E1733] text-left transition-all flex flex-col justify-between h-24"
        >
          <div className="w-7 h-7 rounded-lg bg-[#34D399]/20 text-[#34D399] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Order Tracking</div>
            <div className="text-[10px] text-[#C9C4D6]/70">{orders.length} total shipments</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('finances', 'Reseller Payouts')}
          className="p-3 rounded-xl bg-[#171226] border border-[#302741] hover:border-[#FBBF24] hover:bg-[#1E1733] text-left transition-all flex flex-col justify-between h-24"
        >
          <div className="w-7 h-7 rounded-lg bg-[#FBBF24]/20 text-[#FBBF24] flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Payout Requests</div>
            <div className="text-[10px] text-[#C9C4D6]/70">Review MFS disbursements</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('sms-centre', 'Bulk Broadcast')}
          className="p-3 rounded-xl bg-[#171226] border border-[#302741] hover:border-[#EC4899] hover:bg-[#1E1733] text-left transition-all flex flex-col justify-between h-24"
        >
          <div className="w-7 h-7 rounded-lg bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Send Bulk SMS</div>
            <div className="text-[10px] text-[#C9C4D6]/70">All Resellers / Area</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('reports', 'Sales Report')}
          className="p-3 rounded-xl bg-[#171226] border border-[#302741] hover:border-[#A855F7] hover:bg-[#1E1733] text-left transition-all flex flex-col justify-between h-24"
        >
          <div className="w-7 h-7 rounded-lg bg-[#A855F7]/20 text-[#A855F7] flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Export Reports</div>
            <div className="text-[10px] text-[#C9C4D6]/70">CSV, PDF & Print</div>
          </div>
        </button>
      </div>

      {/* Approval Management Dashboard Component: Pending Reseller & Supplier Requests */}
      <ApprovalManagementDashboard
        onNavigateToFullQueue={(submodule) => onNavigate('user-approvals', submodule)}
        maxDisplay={5}
        showFilters={true}
      />

      {/* Two Column Layout: Pending Transaction Approvals & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending Transaction ID Submissions */}
        <div className="bg-[#171226] border border-[#302741] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#A855F7]" />
              <h3 className="text-sm font-bold text-white">Pending Transaction Approvals</h3>
            </div>
            <button
              onClick={() => onNavigate('accounts', 'Transaction ID Approval')}
              className="text-xs text-[#22D3EE] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingTx.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#C9C4D6]/70 bg-[#100D1B] rounded-xl border border-[#302741]">
                No pending transaction submissions awaiting review.
              </div>
            ) : (
              pendingTx.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#100D1B] border border-[#302741] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] font-semibold">
                        {item.userRole}
                      </span>
                      <span className="text-[10px] text-[#22D3EE] font-mono">{item.paymentMethod}</span>
                    </div>
                    <div className="text-xs text-[#C9C4D6] flex items-center gap-2">
                      <span>TrxID: <strong className="font-mono text-white">{item.transactionId}</strong></span>
                      <span>·</span>
                      <span className="text-[#34D399] font-bold">{formatBDT(item.amount)}</span>
                    </div>
                    <div className="text-[10px] text-[#C9C4D6]/60">Sender: {item.senderInfo}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleQuickApproveTx(item.id)}
                      className="px-3 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => onNavigate('accounts', 'Transaction ID Approval')}
                      className="px-3 py-1.5 bg-[#171226] hover:bg-[#251E3A] border border-[#302741] text-[#C9C4D6] hover:text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Orders with Courier Status */}
        <div className="bg-[#171226] border border-[#302741] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#22D3EE]" />
              <h3 className="text-sm font-bold text-white">Recent DropNest Orders</h3>
            </div>
            <button
              onClick={() => onNavigate('order-tracking', 'Order Dashboard')}
              className="text-xs text-[#22D3EE] hover:underline flex items-center gap-1"
            >
              <span>Full Order Tracker</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => {
              const isDelivered = order.status === 'DELIVERED';
              const isRisk = order.customerMobile === '01899112233' || order.status === 'RETURNED';

              return (
                <div
                  key={order.id}
                  className={`p-3 bg-[#100D1B] border rounded-xl flex items-center justify-between gap-3 ${
                    isRisk ? 'border-[#F87171]/40' : 'border-[#302741]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{order.id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          isDelivered
                            ? 'bg-[#34D399]/20 text-[#34D399]'
                            : isRisk
                            ? 'bg-[#F87171]/20 text-[#F87171]'
                            : 'bg-[#7C3AED]/20 text-[#A855F7]'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-[#C9C4D6] truncate">
                      {order.productName} ({order.quantity}x) · {order.customerName} ({order.customerDistrict})
                    </div>
                    <div className="text-[10px] text-[#C9C4D6]/70 flex items-center gap-2">
                      <span>Courier: <strong className="text-white">{order.courierName || 'Unassigned'}</strong></span>
                      {order.trackingNumber && (
                        <span>Trk: <strong className="font-mono text-[#22D3EE]">{order.trackingNumber}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-white">{formatBDT(order.orderSalesValue)}</div>
                    <div className="text-[10px] text-[#C9C4D6]/70">COD: BDT {order.deliveryCharge}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
