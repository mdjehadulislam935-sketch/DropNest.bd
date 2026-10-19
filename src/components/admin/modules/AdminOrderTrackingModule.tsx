import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Truck,
  User,
  X,
  XCircle
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';
import type { OrderItem, OrderStatus } from '../../../types/platform.ts';
import type { AdminPermissions } from '../../../types/admin.ts';

interface AdminOrderTrackingModuleProps {
  initialSubmodule?: string;
}

export const AdminOrderTrackingModule: React.FC<AdminOrderTrackingModuleProps> = ({ initialSubmodule }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [fraudFilterOnly, setFraudFilterOnly] = useState(initialSubmodule === 'Fraud Alert');

  // Modals & Details
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [statusModalOrder, setStatusModalOrder] = useState<OrderItem | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordRes, permRes] = await Promise.all([
        ApiService.getOrders(),
        ApiService.getAdminPermissions(),
      ]);
      setOrders(ordRes);
      setPermissions(permRes);
    } catch (err: any) {
      console.error('Failed to load order tracking data:', err);
      setFeedback({ text: 'Failed to load order data from server.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live card counts
  const totalOrders = orders.length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const inTransitCount = orders.filter((o) => o.status === 'IN_TRANSIT').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;
  const returnedCount = orders.filter((o) => o.status === 'RETURNED').length;

  // Detect repeat cancellation or return frequency by customer mobile
  const returnCountsByMobile = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.status === 'RETURNED' || o.status === 'CANCELLED') {
      acc[o.customerMobile] = (acc[o.customerMobile] || 0) + 1;
    }
    return acc;
  }, {});

  const isCustomerHighRisk = (mobile: string) => {
    // Flag if 2 or more cancellations/returns or flagged numbers
    return (returnCountsByMobile[mobile] || 0) >= 2 || mobile === '01899112233';
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalOrder) return;

    if (!permissions?.canChangeOrderStatus) {
      setFeedback({
        text: 'Permission Denied: You do not have authorization to modify order statuses. Contact Super Admin.',
        isError: true,
      });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await ApiService.updateAdminOrderStatus(statusModalOrder.id, newStatus, statusReason);
      setFeedback({ text: `Order ${statusModalOrder.invoiceNumber} status updated to ${newStatus}.` });
      setStatusModalOrder(null);
      setStatusReason('');
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Status update failed.', isError: true });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (courierFilter !== 'ALL') {
      if (courierFilter === 'Steadfast' && !o.courierName?.includes('Steadfast')) return false;
      if (courierFilter === 'Pathao' && !o.courierName?.includes('Pathao')) return false;
      if (courierFilter === 'RedX' && !o.courierName?.includes('RedX')) return false;
      if (courierFilter === 'Paperfly' && !o.courierName?.includes('Paperfly')) return false;
    }
    if (fraudFilterOnly && !isCustomerHighRisk(o.customerMobile)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInvoice = o.invoiceNumber.toLowerCase().includes(q);
      const matchCustomer = o.customerName.toLowerCase().includes(q);
      const matchMobile = o.customerMobile.includes(q);
      const matchReseller = o.resellerName.toLowerCase().includes(q);
      const matchTracking = o.trackingNumber?.toLowerCase().includes(q);
      const matchConsignment = o.id.toLowerCase().includes(q);
      if (!matchInvoice && !matchCustomer && !matchMobile && !matchReseller && !matchTracking && !matchConsignment) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30';
      case 'IN_TRANSIT':
      case 'SHIPPED':
        return 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30';
      case 'CONFIRMED':
        return 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30';
      case 'PROCESSING':
        return 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30';
      case 'RETURNED':
        return 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40 font-bold';
      case 'CANCELLED':
        return 'bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30';
      default:
        return 'bg-[#C9C4D6]/15 text-[#C9C4D6] border-[#C9C4D6]/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.isError
              ? 'bg-[#F87171]/10 border-[#F87171]/40 text-[#F87171]'
              : 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? <AlertOctagon className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171226] border border-[#302741] p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              <Truck className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Order Tracking & Courier Central
            </h2>
          </div>
          <p className="text-xs text-[#C9C4D6] mt-1">
            Real-time live consignment status, courier gateway telemetry (Steadfast, Pathao, RedX, Paperfly), fraud risk alarms & delivery note management.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Live Order Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div
          onClick={() => { setStatusFilter('ALL'); setFraudFilterOnly(false); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ALL' && !fraudFilterOnly
              ? 'bg-[#7C3AED]/20 border-[#7C3AED]'
              : 'bg-[#171226] border-[#302741] hover:border-[#7C3AED]/50'
          }`}
        >
          <p className="text-[10px] uppercase font-bold text-[#C9C4D6]">Total Consignments</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{totalOrders}</p>
        </div>

        <div
          onClick={() => { setStatusFilter('PROCESSING'); setFraudFilterOnly(false); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'PROCESSING'
              ? 'bg-[#FBBF24]/20 border-[#FBBF24]'
              : 'bg-[#171226] border-[#302741] hover:border-[#FBBF24]/50'
          }`}
        >
          <p className="text-[10px] uppercase font-bold text-[#FBBF24]">Processing</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{processingCount}</p>
        </div>

        <div
          onClick={() => { setStatusFilter('CONFIRMED'); setFraudFilterOnly(false); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'CONFIRMED'
              ? 'bg-[#A855F7]/20 border-[#A855F7]'
              : 'bg-[#171226] border-[#302741] hover:border-[#A855F7]/50'
          }`}
        >
          <p className="text-[10px] uppercase font-bold text-[#A855F7]">Confirmed</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{confirmedCount}</p>
        </div>

        <div
          onClick={() => { setStatusFilter('IN_TRANSIT'); setFraudFilterOnly(false); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'IN_TRANSIT'
              ? 'bg-[#22D3EE]/20 border-[#22D3EE]'
              : 'bg-[#171226] border-[#302741] hover:border-[#22D3EE]/50'
          }`}
        >
          <p className="text-[10px] uppercase font-bold text-[#22D3EE]">In Transit</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{inTransitCount}</p>
        </div>

        <div
          onClick={() => { setStatusFilter('DELIVERED'); setFraudFilterOnly(false); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'DELIVERED'
              ? 'bg-[#34D399]/20 border-[#34D399]'
              : 'bg-[#171226] border-[#302741] hover:border-[#34D399]/50'
          }`}
        >
          <p className="text-[10px] uppercase font-bold text-[#34D399]">Delivered</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{deliveredCount}</p>
        </div>

        <div
          onClick={() => { setStatusFilter('CANCELLED'); setFraudFilterOnly(false); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'CANCELLED'
              ? 'bg-[#F87171]/20 border-[#F87171]'
              : 'bg-[#171226] border-[#302741] hover:border-[#F87171]/50'
          }`}
        >
          <p className="text-[10px] uppercase font-bold text-[#F87171]">Cancelled</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{cancelledCount}</p>
        </div>

        <div
          onClick={() => { setStatusFilter('RETURNED'); setFraudFilterOnly(false); }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'RETURNED'
              ? 'bg-[#F87171]/30 border-[#F87171]'
              : 'bg-[#171226] border-[#302741] hover:border-[#F87171]/50'
          }`}
        >
          <p className="text-[10px] uppercase font-bold text-[#F87171] flex items-center gap-1">
            Returned
          </p>
          <p className="text-xl font-extrabold text-[#F87171] mt-1 tabular-nums">{returnedCount}</p>
        </div>
      </div>

      {/* Search, Filter Toolbar & Fraud Toggle */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[#C9C4D6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice, customer, mobile, reseller or consignment ID..."
              className="w-full bg-[#100D1B] border border-[#302741] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          {/* Courier Partner Filter */}
          <div className="sm:col-span-3">
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="ALL">All Courier Gateways</option>
              <option value="Steadfast">Steadfast Logistics BD</option>
              <option value="Pathao">Pathao Courier</option>
              <option value="RedX">RedX Logistics</option>
              <option value="Paperfly">Paperfly BD</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PROCESSING">Processing</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Fraud Filter Button */}
          <div className="sm:col-span-2">
            <button
              onClick={() => setFraudFilterOnly(!fraudFilterOnly)}
              className={`w-full h-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                fraudFilterOnly
                  ? 'bg-[#F87171] text-white border-[#F87171]'
                  : 'bg-[#100D1B] border-[#302741] text-[#F87171] hover:bg-[#F87171]/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Fraud Alarms</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#100D1B] border-b border-[#302741] text-[#C9C4D6] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Invoice / Date</th>
                <th className="py-3 px-4">Customer & Address</th>
                <th className="py-3 px-4">Reseller</th>
                <th className="py-3 px-4">Product & Value</th>
                <th className="py-3 px-4">Courier Partner</th>
                <th className="py-3 px-4">Status & Risk</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#302741]/50 text-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#C9C4D6]">
                    No orders match your specified search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isHighRisk = isCustomerHighRisk(order.customerMobile);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-[#1C1630] transition-colors ${
                        isHighRisk ? 'bg-[#F87171]/5' : ''
                      }`}
                    >
                      {/* Invoice / Date */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#A855F7] block">
                          {order.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-[#C9C4D6]/70 block mt-0.5">
                          {formatBangladeshDateTime(order.orderDate)}
                        </span>
                      </td>

                      {/* Customer & Address */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <span>{order.customerName}</span>
                          {isHighRisk && (
                            <span
                              title="Customer with frequent returns/cancellations"
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F87171] text-white flex items-center gap-0.5"
                            >
                              <ShieldAlert className="w-2.5 h-2.5" /> High Return Risk
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#22D3EE] mt-0.5 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 shrink-0" />
                          <span>{order.customerMobile}</span>
                        </div>
                        <div className="text-[10px] text-[#C9C4D6] truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0 text-[#C9C4D6]/60" />
                          <span>{order.customerUpazila}, {order.customerDistrict}</span>
                        </div>
                      </td>

                      {/* Reseller */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{order.resellerName}</span>
                        <span className="text-[10px] text-[#34D399] font-mono block">
                          Profit: {formatBDT(order.resellerProfit ?? (order.orderSalesValue - order.supplierResellerPrice * order.quantity))}
                        </span>
                      </td>

                      {/* Product & Value */}
                      <td className="py-3 px-4">
                        <span className="text-white block font-medium truncate max-w-[150px]">
                          {order.productName}
                        </span>
                        <span className="text-[10px] text-[#C9C4D6] block">
                          Qty: {order.quantity} · {formatBDT(order.orderSalesValue)}
                        </span>
                      </td>

                      {/* Courier Partner */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <Truck className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>{order.courierName || 'Unassigned'}</span>
                        </div>
                        {order.trackingNumber && (
                          <div className="text-[10px] font-mono text-[#A855F7] mt-0.5">
                            Track: {order.trackingNumber}
                          </div>
                        )}
                        <div className="text-[10px] text-[#C9C4D6]/70 mt-0.5">
                          Delivery Chg: {formatBDT(order.deliveryCharge)}
                        </div>
                      </td>

                      {/* Status & Risk */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                        {order.status === 'RETURNED' && (
                          <span className="block text-[10px] text-[#F87171] font-semibold mt-1">
                            Courier Return Logged
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-[#100D1B] hover:bg-[#1F1934] border border-[#302741] text-[#C9C4D6] hover:text-white"
                            title="View Consignment Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setStatusModalOrder(order);
                              setNewStatus(order.status);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-[10px] transition-colors"
                            title="Change Order Status / Notes"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#A855F7]" />
                <h3 className="text-sm font-bold text-white">Consignment #{selectedOrder.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#C9C4D6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] space-y-1">
                <span className="text-[10px] text-[#C9C4D6] block">Customer Details</span>
                <p className="font-bold text-white">{selectedOrder.customerName}</p>
                <p className="text-[#22D3EE] font-mono">{selectedOrder.customerMobile}</p>
                <p className="text-[#C9C4D6] text-[11px]">{selectedOrder.customerAddress || selectedOrder.deliveryAddress}</p>
                <p className="text-[#A855F7] font-semibold">{selectedOrder.customerUpazila}, {selectedOrder.customerDistrict}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] space-y-1">
                <span className="text-[10px] text-[#C9C4D6] block">Courier Gateway Status</span>
                <p className="font-bold text-white">{selectedOrder.courierName || 'Pending Assignment'}</p>
                <p className="text-[#22D3EE] font-mono">Track: {selectedOrder.trackingNumber || 'N/A'}</p>
                <p className="text-[#C9C4D6] text-[11px]">Delivery Charge: {formatBDT(selectedOrder.deliveryCharge)}</p>
                <p className="text-[#34D399]">Live Status: {selectedOrder.status}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Product Ordered:</span>
                <span className="font-semibold text-white">{selectedOrder.productName} (x{selectedOrder.quantity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Total Sales Value:</span>
                <span className="font-bold text-[#34D399]">{formatBDT(selectedOrder.orderSalesValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Reseller Commission:</span>
                <span className="font-bold text-[#A855F7]">{formatBDT(selectedOrder.resellerProfit ?? (selectedOrder.orderSalesValue - selectedOrder.supplierResellerPrice * selectedOrder.quantity))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Payment Mode:</span>
                <span className="text-white">{selectedOrder.paymentStatus} (Cash on Delivery)</span>
              </div>
            </div>

            {isCustomerHighRisk(selectedOrder.customerMobile) && (
              <div className="p-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/40 text-[#F87171] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Fraud Alert & High Return Risk</span>
                </div>
                <p className="text-[11px] text-[#F87171]/90">
                  This mobile number has repeat cancellation/return events in the DropNest database. Ensure upfront customer verification call before dispatch.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-[#302741] hover:bg-[#3E3354] rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Order Status Modal */}
      {statusModalOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleUpdateStatus}
            className="bg-[#171226] border border-[#302741] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <h3 className="text-sm font-bold text-white">
                Update Status · {statusModalOrder.invoiceNumber}
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                className="text-[#C9C4D6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#C9C4D6] mb-1">
                  New Order Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="IN_TRANSIT">IN TRANSIT</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="RETURNED">RETURNED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#C9C4D6] mb-1">
                  Operational Note / Reason
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g., Customer confirmed delivery time over phone call / Courier unable to reach address..."
                  rows={3}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
              >
                {isUpdatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Status</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
