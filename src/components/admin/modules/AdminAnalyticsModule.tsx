import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Layers,
  PieChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Truck,
  Users
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import { formatBDT } from '../../../utils/formatters.ts';

interface AdminAnalyticsModuleProps {
  initialSubmodule?: string;
}

export const AdminAnalyticsModule: React.FC<AdminAnalyticsModuleProps> = ({ initialSubmodule }) => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'ORDERS' | 'USERS' | 'FINANCES'>(() => {
    if (initialSubmodule === 'Order Analytics') return 'ORDERS';
    if (initialSubmodule === 'User Growth') return 'USERS';
    if (initialSubmodule === 'Financial Trends') return 'FINANCES';
    return 'SALES';
  });

  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (period: string) => {
    setIsLoading(true);
    try {
      const data = await ApiService.getAdminAnalytics(period);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(dateFilter);
  }, [dateFilter]);

  return (
    <div className="space-y-6">
      {/* Module Header & Period Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#171226] border border-[#302741] p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Platform Analytics & Performance Telemetry
            </h2>
          </div>
          <p className="text-xs text-[#C9C4D6] mt-1">
            Real-time tracking of sales growth, delivery completion SLA, seller adoption curves & platform financial yields.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#100D1B] p-1.5 rounded-xl border border-[#302741]">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'LAST_MONTH', label: 'Last Month' },
            { id: 'CUSTOM', label: 'Custom Range' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setDateFilter(period.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === period.id
                  ? 'bg-[#7C3AED] text-white'
                  : 'text-[#C9C4D6] hover:text-white hover:bg-[#1C1630]'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Picker */}
      {dateFilter === 'CUSTOM' && (
        <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#C9C4D6]">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#C9C4D6]">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <button
            onClick={() => loadData(`CUSTOM_${customStart}_${customEnd}`)}
            className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg text-white font-bold"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-[#302741] pb-2 overflow-x-auto">
        {[
          { id: 'SALES', label: 'Sales Analytics', icon: DollarSign },
          { id: 'ORDERS', label: 'Order & Courier Analytics', icon: Truck },
          { id: 'USERS', label: 'User Growth Analytics', icon: Users },
          { id: 'FINANCES', label: 'Financial & Yield Analytics', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-md'
                  : 'text-[#C9C4D6] hover:text-white hover:bg-[#171226]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[#C9C4D6]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED] mb-2" />
          <p className="text-xs">Computing aggregated analytics metrics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: SALES ANALYTICS */}
          {activeTab === 'SALES' && analytics && (
            <div className="space-y-6">
              {/* Sales Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#34D399]">
                    Total Gross Sales
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {formatBDT(analytics.sales.totalRevenueBDT)}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-[#34D399] font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+21.4% vs previous period</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                    Total Orders Placed
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {analytics.sales.totalOrdersCount}
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]/70">
                    {analytics.sales.deliveredCount} successfully delivered
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7]">
                    Average Order Value (AOV)
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {formatBDT(analytics.sales.averageOrderValueBDT)}
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]/70">Per delivered parcel</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FBBF24]">
                    Estimated Platform Commission
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {formatBDT(analytics.financial.platformCommissionBDT)}
                  </p>
                  <p className="text-[11px] text-[#34D399]">5% standard marketplace cut</p>
                </div>
              </div>

              {/* Category Sales & Top Resellers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Sales Visual */}
                <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#A855F7]" />
                    <span>Sales by Product Category</span>
                  </h3>

                  <div className="space-y-3">
                    {analytics.sales.categorySales.map((cat: any) => (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-white">{cat.category}</span>
                          <span className="font-mono text-[#34D399] font-bold">
                            {formatBDT(cat.valueBDT)} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#100D1B] overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#7C3AED] to-[#22D3EE] rounded-full"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reseller Performance Leaderboard */}
                <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#22D3EE]" />
                    <span>Top Reseller Sales Leaderboard</span>
                  </h3>

                  <div className="space-y-2.5">
                    {analytics.sales.resellerSales.map((res: any, idx: number) => (
                      <div
                        key={res.name}
                        className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#7C3AED]/20 text-[#A855F7] font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">{res.name}</p>
                            <p className="text-[10px] text-[#C9C4D6]/70">{res.orders} orders fulfilled</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-[#34D399] font-mono block">
                            {formatBDT(res.salesBDT)}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-[#A855F7] font-bold">
                            Verified Seller
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDER & COURIER ANALYTICS */}
          {activeTab === 'ORDERS' && analytics && (
            <div className="space-y-6">
              {/* Delivery Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#34D399]">Delivery Success Rate</span>
                    <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  </div>
                  <p className="text-3xl font-extrabold text-white tabular-nums">
                    {analytics.orders.successRate}%
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]">
                    Higher than standard Bangladesh e-commerce benchmark (78%)
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F87171]">Cancellation Rate</span>
                    <TrendingDown className="w-4 h-4 text-[#F87171]" />
                  </div>
                  <p className="text-3xl font-extrabold text-white tabular-nums">
                    {analytics.orders.cancellationRate}%
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]">Cancelled before courier handover</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FBBF24]">Courier Return Rate</span>
                    <Truck className="w-4 h-4 text-[#FBBF24]" />
                  </div>
                  <p className="text-3xl font-extrabold text-white tabular-nums">
                    {analytics.orders.returnRate}%
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]">Failed customer doorstep delivery</p>
                </div>
              </div>

              {/* Courier Performance Breakdown */}
              <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#22D3EE]" />
                  <span>Courier Partner SLA & Delivery Success Comparison</span>
                </h3>

                <div className="space-y-4">
                  {analytics.orders.courierPerformance.map((courier: any) => (
                    <div
                      key={courier.courier}
                      className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-bold text-white">{courier.courier}</span>
                        <div className="flex items-center gap-3 text-[11px] text-[#C9C4D6]">
                          <span>Dispatched: <strong className="text-white">{courier.dispatched}</strong></span>
                          <span>Delivered: <strong className="text-[#34D399]">{courier.delivered}</strong></span>
                          <span>Success SLA: <strong className="text-[#22D3EE] font-mono">{courier.successRate}%</strong></span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-[#171226] overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#22D3EE] to-[#34D399] rounded-full"
                          style={{ width: `${courier.successRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USER GROWTH ANALYTICS */}
          {activeTab === 'USERS' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7]">
                    Total Resellers
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {analytics.users.totalResellers}
                  </p>
                  <p className="text-[11px] text-[#34D399]">Active dropshipping merchants</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FBBF24]">
                    Total Suppliers
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {analytics.users.totalSuppliers}
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]">Verified wholesale distributors</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                    Active Sellers (7 Days)
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {analytics.users.activeSellersThisWeek}
                  </p>
                  <p className="text-[11px] text-[#22D3EE]">Generated sales or orders</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#34D399]">
                    New Signups (30 Days)
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    +{analytics.users.newRegistrationsThisMonth}
                  </p>
                  <p className="text-[11px] text-[#34D399]">Net positive platform growth</p>
                </div>
              </div>

              {/* Active to Inactive Ratio Box */}
              <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#A855F7]" />
                  <span>Seller Engagement Health Ratio</span>
                </h3>

                <div className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#34D399] font-bold">Active Resellers (63.5%)</span>
                    <span className="text-[#C9C4D6]">Inactive / Dormant (36.5%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#171226] overflow-hidden flex">
                    <div className="h-full bg-[#34D399]" style={{ width: '63.5%' }} />
                    <div className="h-full bg-[#302741]" style={{ width: '36.5%' }} />
                  </div>
                  <p className="text-[11px] text-[#C9C4D6]">
                    Admin tip: Use SMS Service Centre Bulk Broadcast to engage dormant resellers with trending wholesale catalog notifications.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL ANALYTICS */}
          {activeTab === 'FINANCES' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#34D399]">
                    Net Platform Profit
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {formatBDT(analytics.financial.netProfitBDT)}
                  </p>
                  <p className="text-[11px] text-[#34D399]">After reseller payouts & logistics</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                    Total Marketplace Fees
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {formatBDT(analytics.financial.platformCommissionBDT)}
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]">Transaction & processing share</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FBBF24]">
                    Total Payouts Disbursed
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {formatBDT(analytics.financial.totalPayoutDisbursedBDT)}
                  </p>
                  <p className="text-[11px] text-[#C9C4D6]">bKash, Nagad & Bank settlements</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7]">
                    Revenue Growth Rate
                  </span>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    {analytics.financial.revenueGrowthRate}
                  </p>
                  <p className="text-[11px] text-[#34D399]">Quarter-over-quarter expansion</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
