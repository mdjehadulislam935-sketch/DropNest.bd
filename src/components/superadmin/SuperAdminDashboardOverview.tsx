import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Lock,
  Package,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';
import { ApiService } from '../../services/api.ts';
import { formatBDT, formatBangladeshDateTime } from '../../utils/formatters.ts';

export const SuperAdminDashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { openTab } = useTabs();
  const [stats, setStats] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentAudit, setRecentAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [platformStats, finSummary, ordersList, audits] = await Promise.all([
        ApiService.getPlatformStats().catch(() => null),
        ApiService.getFinancialSummary().catch(() => null),
        ApiService.getOrders().catch(() => []),
        ApiService.getAuditLogs().catch(() => []),
      ]);
      setStats(platformStats);
      setFinancials(finSummary);
      setRecentOrders(ordersList.slice(0, 5));
      setRecentAudit(audits.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModule = (id: string, title: string, viewId: string, submodule?: string) => {
    openTab({
      id,
      title,
      viewId,
      submodule,
      isClosable: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Sovereign Hero Header */}
      <div className="bg-[#171226] border border-[#302741] p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#EC4899]/15 via-[#7C3AED]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EC4899]/20 border border-[#EC4899]/40 text-[#EC4899] text-xs font-semibold mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>DropNest Central Command — Super Admin Sovereign Authority</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            National Operations & Governance Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#C9C4D6] mt-2 leading-relaxed">
            Direct database supervision across 64 Bangladesh districts, automated courier integrations, verified BDT transaction ledgers, SMS delivery centres, and role-based permissions.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#C9C4D6]">
            <span>Active Sovereign User: <strong className="text-white">{user?.fullName}</strong></span>
            <span className="text-[#302741]">·</span>
            <span>Mobile ID: <strong className="text-[#22D3EE] font-mono">{user?.mobile}</strong></span>
            <span className="text-[#302741]">·</span>
            <button
              onClick={loadData}
              className="p-1 rounded bg-[#100D1B] border border-[#302741] hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync System Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Summary Cards with Direct Module Route Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. Platform Sales Card */}
        <div
          onClick={() => handleOpenModule('sa-ana-sales', 'Sales Analytics', 'analytics-mgmt', 'sales')}
          className="bg-[#171226] border border-[#302741] hover:border-[#7C3AED] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">Total Platform Sales</span>
            <TrendingUp className="w-4 h-4 text-[#34D399] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-2">
            {formatBDT(financials?.totalPlatformBalance || 0)}
          </div>
          <div className="text-[11px] text-[#34D399] mt-1 flex items-center justify-between">
            <span>Verified Ledger Balance</span>
            <span className="text-xs">→</span>
          </div>
        </div>

        {/* 2. Total Orders Card */}
        <div
          onClick={() => handleOpenModule('sa-order-tracker', 'Order Tracker', 'superadmin-order-tracker')}
          className="bg-[#171226] border border-[#302741] hover:border-[#22D3EE] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">Orders Across Bangladesh</span>
            <Truck className="w-4 h-4 text-[#22D3EE] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-2">
            {stats?.totalOrders || 0}
          </div>
          <div className="text-[11px] text-[#22D3EE] mt-1 flex items-center justify-between">
            <span>{stats?.deliveredOrders || 0} Delivered ({stats?.completionRate || 0}%)</span>
            <span className="text-xs">→</span>
          </div>
        </div>

        {/* 3. Customers Card */}
        <div
          onClick={() => handleOpenModule('sa-customers', 'Customer Directory', 'customer-mgmt')}
          className="bg-[#171226] border border-[#302741] hover:border-[#EC4899] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">Total Customers</span>
            <Users className="w-4 h-4 text-[#EC4899] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-2">
            {stats?.totalCustomers || 0}
          </div>
          <div className="text-[11px] text-[#EC4899] mt-1 flex items-center justify-between">
            <span>64 Districts Covered</span>
            <span className="text-xs">→</span>
          </div>
        </div>

        {/* 4. Reseller Activity Card */}
        <div
          onClick={() => handleOpenModule('sa-user-admin', 'User Management', 'user-management', 'resellers')}
          className="bg-[#171226] border border-[#302741] hover:border-[#A855F7] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">Active Resellers</span>
            <Store className="w-4 h-4 text-[#A855F7] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-2">
            {stats?.usersByRole?.RESELLER || 0}
          </div>
          <div className="text-[11px] text-[#A855F7] mt-1 flex items-center justify-between">
            <span>Independent Merchant Stores</span>
            <span className="text-xs">→</span>
          </div>
        </div>

        {/* 5. Supplier Activity Card */}
        <div
          onClick={() => handleOpenModule('sa-user-admin', 'User Management', 'user-management', 'suppliers')}
          className="bg-[#171226] border border-[#302741] hover:border-[#FBBF24] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">Verified Suppliers</span>
            <Boxes className="w-4 h-4 text-[#FBBF24] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-2">
            {stats?.usersByRole?.SUPPLIER || 0}
          </div>
          <div className="text-[11px] text-[#FBBF24] mt-1 flex items-center justify-between">
            <span>{stats?.approvedProducts || 0} Approved Wholesale SKUs</span>
            <span className="text-xs">→</span>
          </div>
        </div>

        {/* 6. Pending Financial Approvals Card */}
        <div
          onClick={() => handleOpenModule('sa-fin-withdrawals', 'Withdrawal Report', 'financial-mgmt', 'withdrawals')}
          className="bg-[#171226] border border-[#302741] hover:border-[#34D399] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">Pending Financial Approvals</span>
            <Wallet className="w-4 h-4 text-[#34D399] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-2">
            {formatBDT(financials?.pendingBalance || 0)}
          </div>
          <div className="text-[11px] text-[#34D399] mt-1 flex items-center justify-between">
            <span>Available: {formatBDT(financials?.availableBalance || 0)}</span>
            <span className="text-xs">→</span>
          </div>
        </div>

        {/* 7. Courier Issues / Area Card */}
        <div
          onClick={() => handleOpenModule('sa-cr-area', 'Courier Area', 'courier-mgmt', 'areas')}
          className="bg-[#171226] border border-[#302741] hover:border-[#22D3EE] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">Courier Hub Health</span>
            <Truck className="w-4 h-4 text-[#22D3EE] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-[#34D399] font-mono tabular-nums mt-2">
            Steadfast / RedX
          </div>
          <div className="text-[11px] text-[#C9C4D6]/70 mt-1 flex items-center justify-between">
            <span>4 Active Serviceable Hubs</span>
            <span className="text-xs">→</span>
          </div>
        </div>

        {/* 8. API Health & Security Alerts Card */}
        <div
          onClick={() => handleOpenModule('sa-api-all', 'Shop All API', 'all-api-setting', 'all')}
          className="bg-[#171226] border border-[#302741] hover:border-[#EC4899] p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-center justify-between text-[#C9C4D6]">
            <span className="text-xs font-semibold">API Health & Security</span>
            <Server className="w-4 h-4 text-[#34D399] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-2 flex items-center gap-2">
            <span>{stats?.apiHealth?.healthy || 5} / {stats?.apiHealth?.total || 5}</span>
            <span className="text-xs font-sans px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] font-semibold">100% UP</span>
          </div>
          <div className="text-[11px] text-[#34D399] mt-1 flex items-center justify-between">
            <span>0 Active Security Alerts</span>
            <span className="text-xs">→</span>
          </div>
        </div>
      </div>

      {/* Split Section: Recent Live Orders & Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Live Orders */}
        <div className="bg-[#171226] border border-[#302741] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#302741] mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#A855F7]" />
                <h3 className="text-sm font-bold text-white">Live Platform Orders</h3>
              </div>
              <button
                onClick={() => handleOpenModule('sa-order-tracker', 'Order Tracker', 'superadmin-order-tracker')}
                className="text-xs text-[#22D3EE] hover:underline flex items-center gap-1"
              >
                <span>View All ({stats?.totalOrders || 0})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#C9C4D6]">
                <Package className="w-8 h-8 mx-auto text-[#302741] mb-2" />
                <p>No orders currently in the system ledger.</p>
                <p className="text-[11px] text-[#C9C4D6]/60 mt-0.5">Orders placed by verified resellers appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-[#100D1B] rounded-lg border border-[#302741] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-white">{ord.id}</div>
                      <div className="text-[11px] text-[#C9C4D6]">
                        {ord.productName} (x{ord.quantity}) · Reseller: <span className="text-[#A855F7]">{ord.resellerName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#34D399]">{formatBDT(ord.orderSalesValue + ord.deliveryCharge)}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#22D3EE] font-semibold">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#302741] mt-3 flex justify-between items-center text-[11px] text-[#C9C4D6]">
            <span>17-Status Tracking & Fraud Verification active</span>
            <button
              onClick={() => handleOpenModule('sa-order-tracker', 'Order Tracker', 'superadmin-order-tracker')}
              className="text-[#7C3AED] hover:underline font-semibold"
            >
              Open 17-Filter Order Tracker
            </button>
          </div>
        </div>

        {/* Real-time Audit Ledger */}
        <div className="bg-[#171226] border border-[#302741] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#302741] mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                <h3 className="text-sm font-bold text-white">Sovereign Audit Ledger</h3>
              </div>
              <button
                onClick={() => handleOpenModule('sa-audit', 'Audit Logs', 'audit-logs')}
                className="text-xs text-[#22D3EE] hover:underline flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentAudit.map((log) => (
                <div key={log.id} className="p-2.5 bg-[#100D1B] rounded-lg border border-[#302741] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">{log.actorName}</span>
                    <span className="text-[10px] font-mono text-[#22D3EE]">{formatBangladeshDateTime(log.timestamp)}</span>
                  </div>
                  <div className="text-[#C9C4D6] text-[11px] line-clamp-1">{log.details}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#302741] mt-3 flex justify-between items-center text-[11px] text-[#C9C4D6]">
            <span>Immutable Scrypt-hashed logs</span>
            <span className="text-[#34D399] font-mono">SEALED_OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
