import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Layers,
  MapPin,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
  User,
  X
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { OrderItem, OrderStatus, PaymentStatus } from '../../../types/platform.ts';
import { BANGLADESH_DISTRICTS } from '../../../data/bangladeshLocations.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';

// 17 Comprehensive Super Admin Order Tracker Statuses
const ORDER_STATUS_CONFIG: Array<{ key: OrderStatus; label: string; color: string }> = [
  { key: 'ORDER_VERIFICATION', label: '1. In Review', color: '#FBBF24' },
  { key: 'PAYMENT_PENDING', label: '2. Pending', color: '#F59E0B' },
  { key: 'CANCELLED', label: '3. Cancel', color: '#F87171' },
  { key: 'PROCESSING', label: '4. Processing', color: '#22D3EE' },
  { key: 'READY_TO_SHIP', label: '5. Packaging', color: '#A855F7' },
  { key: 'AWAITING_SUPPLIER', label: '6. Waiting For Courier', color: '#EC4899' },
  { key: 'COURIER_ASSIGNED', label: '7. Dropped', color: '#818CF8' },
  { key: 'IN_TRANSIT', label: '8. Shifted / In Transit', color: '#38BDF8' },
  { key: 'SUPPLIER_CONFIRMED', label: '9. At Delivery Hub', color: '#60A5FA' },
  { key: 'OUT_FOR_DELIVERY', label: '10. Out for Delivery', color: '#F472B6' },
  { key: 'FRAUD_REVIEW', label: '11. Hold', color: '#FB923C' },
  { key: 'REFUND_PENDING', label: '12. Rescheduled', color: '#C084FC' },
  { key: 'DELIVERED', label: '13. Delivered', color: '#34D399' },
  { key: 'PAYMENT_CONFIRMED', label: '14. Partial Delivered', color: '#10B981' },
  { key: 'RETURN_REQUESTED', label: '15. Return', color: '#F43F5E' },
  { key: 'RETURNED', label: '16. Returned to Hub', color: '#E11D48' },
  { key: 'REFUND_COMPLETED', label: '17. Returned to Merchant', color: '#9F1239' },
];

export const OrderTrackerModule: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');

  // Search Filters
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchResellerMobile, setSearchResellerMobile] = useState('');
  const [searchCustomerMobile, setSearchCustomerMobile] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchUpazila, setSearchUpazila] = useState('');
  const [searchSupplierMobile, setSearchSupplierMobile] = useState('');
  const [searchCourier, setSearchCourier] = useState('');
  const [searchPaymentStatus, setSearchPaymentStatus] = useState('');

  // Bulk Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Status Change Dialog
  const [statusDialogOrder, setStatusDialogOrder] = useState<OrderItem | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [statusReason, setStatusReason] = useState('');
  const [statusCourier, setStatusCourier] = useState('');
  const [statusTrackingId, setStatusTrackingId] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);

  // Selected Order Detail Modal
  const [detailModalOrder, setDetailModalOrder] = useState<OrderItem | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getOrders();
      setOrders(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders according to all 10 criteria
  const filteredOrders = orders.filter((o) => {
    if (activeStatusFilter !== 'ALL' && o.status !== activeStatusFilter) return false;
    if (searchOrderId && !o.id.toLowerCase().includes(searchOrderId.toLowerCase())) return false;
    if (searchResellerMobile && !o.resellerName.toLowerCase().includes(searchResellerMobile.toLowerCase())) return false;
    if (searchCustomerMobile && !o.customerMobile.includes(searchCustomerMobile)) return false;
    if (searchDistrict && o.customerDistrict.toLowerCase() !== searchDistrict.toLowerCase()) return false;
    if (searchUpazila && !o.customerUpazila.toLowerCase().includes(searchUpazila.toLowerCase())) return false;
    if (searchSupplierMobile && !o.supplierName.toLowerCase().includes(searchSupplierMobile.toLowerCase())) return false;
    if (searchCourier && (!o.courierName || !o.courierName.toLowerCase().includes(searchCourier.toLowerCase()))) return false;
    if (searchPaymentStatus && o.paymentStatus !== searchPaymentStatus) return false;
    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openStatusChangeDialog = (order: OrderItem) => {
    setStatusDialogOrder(order);
    setNewStatus(order.status);
    setStatusReason('');
    setStatusCourier(order.courierName || 'Steadfast Logistics BD');
    setStatusTrackingId(order.trackingNumber || '');
    setStatusSuccessMsg(null);
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusDialogOrder) return;
    setUpdatingStatus(true);
    setStatusSuccessMsg(null);
    try {
      await ApiService.updateOrderStatus(statusDialogOrder.id, newStatus, statusReason || 'Super Admin Manual Transition');
      setStatusSuccessMsg(`Order #${statusDialogOrder.id} status transitioned to "${newStatus}". Customer SMS dispatched simulation.`);
      await fetchOrders();
      setTimeout(() => {
        setStatusDialogOrder(null);
        setStatusSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBulkStatusChange = async (targetStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`Apply status "${targetStatus}" to ${selectedOrderIds.length} selected orders?`)) return;
    setLoading(true);
    try {
      for (const id of selectedOrderIds) {
        await ApiService.updateOrderStatus(id, targetStatus, 'Bulk Status Update via Super Admin');
      }
      setSelectedOrderIds([]);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Bulk update failed');
    } finally {
      setLoading(false);
    }
  };

  const exportOrdersCSV = () => {
    const headers = [
      'Order ID',
      'Invoice',
      'Date',
      'Status',
      'Product',
      'Qty',
      'Reseller Sell (BDT)',
      'Delivery (BDT)',
      'Total (BDT)',
      'Reseller',
      'Customer',
      'Mobile',
      'District',
      'Upazila',
      'Courier',
      'Tracking ID',
      'Payment Status'
    ];

    const rows = filteredOrders.map((o) => [
      o.id,
      o.invoiceNumber,
      o.orderDate,
      o.status,
      `"${o.productName.replace(/"/g, '""')}"`,
      o.quantity,
      o.orderSalesValue,
      o.deliveryCharge,
      o.orderSalesValue + o.deliveryCharge,
      `"${o.resellerName}"`,
      `"${o.customerName}"`,
      o.customerMobile,
      o.customerDistrict,
      o.customerUpazila,
      `"${o.courierName || 'Unassigned'}"`,
      o.trackingNumber || 'N/A',
      o.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `DropNest_Order_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Module Title Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#EC4899]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">5. Order Tracker & Logistics Command</h2>
            <p className="text-xs text-[#C9C4D6]">
              Real-time multi-criteria filtering across 17 granular fulfillment stages, fraud review, and courier dispatches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-1.5 p-1 bg-[#100D1B] border border-[#302741] rounded-lg">
              <span className="text-xs font-semibold text-[#22D3EE] px-2">{selectedOrderIds.length} Selected</span>
              <button
                onClick={() => handleBulkStatusChange('IN_TRANSIT')}
                className="px-2.5 py-1 rounded bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold"
              >
                Mark In-Transit
              </button>
              <button
                onClick={() => handleBulkStatusChange('DELIVERED')}
                className="px-2.5 py-1 rounded bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold"
              >
                Mark Delivered
              </button>
            </div>
          )}

          <button
            onClick={exportOrdersCSV}
            className="px-3 py-1.5 rounded-lg bg-[#100D1B] border border-[#302741] hover:text-white text-xs text-[#C9C4D6] flex items-center gap-1.5"
            title="Export filtered orders to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh order registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 17 Granular Status Filter Tabs (Horizontally scrollable with counts) */}
      <div className="bg-[#171226] border border-[#302741] p-2 rounded-xl overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => setActiveStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeStatusFilter === 'ALL'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#C9C4D6] hover:bg-[#100D1B] hover:text-white'
            }`}
          >
            All Orders ({orders.length})
          </button>

          {ORDER_STATUS_CONFIG.map((cfg) => {
            const count = orders.filter((o) => o.status === cfg.key).length;
            const isActive = activeStatusFilter === cfg.key;
            return (
              <button
                key={cfg.key}
                onClick={() => setActiveStatusFilter(cfg.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-[#302741] text-white ring-1 ring-[#7C3AED]'
                    : 'text-[#C9C4D6] hover:bg-[#100D1B]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span>{cfg.label}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-[#080611] text-[#22D3EE]">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Criteria Search Panel (10 Specified Query Dimensions) */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-white">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Multi-Parameter Order Query Engine (10 Dimensions)</span>
          </div>
          {(searchOrderId || searchCustomerMobile || searchResellerMobile || searchDistrict || searchUpazila || searchCourier || searchPaymentStatus) && (
            <button
              onClick={() => {
                setSearchOrderId('');
                setSearchCustomerMobile('');
                setSearchResellerMobile('');
                setSearchDistrict('');
                setSearchUpazila('');
                setSearchSupplierMobile('');
                setSearchCourier('');
                setSearchPaymentStatus('');
              }}
              className="text-[#EC4899] hover:underline text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1 font-mono">1. Order ID</label>
            <input
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="e.g. DN-ORD-"
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1">2. Customer Mobile</label>
            <input
              type="text"
              value={searchCustomerMobile}
              onChange={(e) => setSearchCustomerMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1">3. Reseller Name / Mobile</label>
            <input
              type="text"
              value={searchResellerMobile}
              onChange={(e) => setSearchResellerMobile(e.target.value)}
              placeholder="Merchant / Reseller..."
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1">4. Customer District</label>
            <select
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#7C3AED]"
            >
              <option value="">All 64 Districts</option>
              {BANGLADESH_DISTRICTS.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.division})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1">5. Customer Upazila</label>
            <input
              type="text"
              value={searchUpazila}
              onChange={(e) => setSearchUpazila(e.target.value)}
              placeholder="e.g. Mirpur, Sadar..."
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1">6. Supplier Name</label>
            <input
              type="text"
              value={searchSupplierMobile}
              onChange={(e) => setSearchSupplierMobile(e.target.value)}
              placeholder="Wholesale Supplier..."
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1">7. Courier Partner</label>
            <select
              value={searchCourier}
              onChange={(e) => setSearchCourier(e.target.value)}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="">All Couriers</option>
              <option value="Steadfast">Steadfast Logistics BD</option>
              <option value="RedX">RedX Logistics</option>
              <option value="Paperfly">Paperfly</option>
              <option value="Pathao">Pathao Courier</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#C9C4D6] mb-1">8. Payment Status</label>
            <select
              value={searchPaymentStatus}
              onChange={(e) => setSearchPaymentStatus(e.target.value)}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="">All Payment States</option>
              <option value="UNPAID">UNPAID (COD)</option>
              <option value="PAID">PAID</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="SETTLED">SETTLED</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <div className="text-[11px] text-[#34D399] font-mono p-2 rounded bg-[#100D1B] border border-[#302741] w-full text-center">
              Matched Orders: <strong className="text-white">{filteredOrders.length}</strong> of {orders.length}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#C9C4D6]">
            <thead className="bg-[#080611] text-white uppercase text-[10px] tracking-wider border-b border-[#302741]">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleSelectAll}
                    className="rounded bg-[#100D1B] border-[#302741] text-[#7C3AED]"
                  />
                </th>
                <th className="px-4 py-3">Order ID & Date</th>
                <th className="px-4 py-3">Fulfillment Status</th>
                <th className="px-4 py-3">Product & SKU</th>
                <th className="px-4 py-3">Customer & Location</th>
                <th className="px-4 py-3">Reseller & Supplier</th>
                <th className="px-4 py-3">Courier & Tracking</th>
                <th className="px-4 py-3 text-right">Value (BDT)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#302741]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#C9C4D6]">
                    <Package className="w-8 h-8 mx-auto text-[#302741] mb-2" />
                    <p>No orders match the specified filter configuration.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const statusCfg = ORDER_STATUS_CONFIG.find((c) => c.key === ord.status);
                  const isSelected = selectedOrderIds.includes(ord.id);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-[#100D1B] transition-colors ${isSelected ? 'bg-[#7C3AED]/10' : ''}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(ord.id)}
                          className="rounded bg-[#100D1B] border-[#302741] text-[#7C3AED]"
                        />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{ord.id}</span>
                        </div>
                        <div className="text-[10px] text-[#22D3EE] font-mono">
                          {formatBangladeshDateTime(ord.orderDate)}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1.5 border"
                          style={{
                            borderColor: `${statusCfg?.color || '#7C3AED'}40`,
                            backgroundColor: `${statusCfg?.color || '#7C3AED'}15`,
                            color: statusCfg?.color || '#FFFFFF',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: statusCfg?.color || '#7C3AED' }}
                          />
                          {statusCfg?.label || ord.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-white truncate">{ord.productName}</div>
                        <div className="text-[11px] text-[#C9C4D6]/70 font-mono">
                          SKU: {ord.sku} (x{ord.quantity})
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{ord.customerName}</div>
                        <div className="text-[11px] font-mono text-[#22D3EE]">{ord.customerMobile}</div>
                        <div className="text-[10px] text-[#C9C4D6]">
                          {ord.customerUpazila}, {ord.customerDistrict}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-white text-[11px]">
                          Reseller: <strong className="text-[#A855F7]">{ord.resellerName}</strong>
                        </div>
                        <div className="text-[#C9C4D6]/70 text-[10px]">
                          Supplier: <span className="text-[#FBBF24]">{ord.supplierName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{ord.courierName || 'Unassigned'}</div>
                        <div className="font-mono text-[10px] text-[#22D3EE]">
                          {ord.trackingNumber ? `#${ord.trackingNumber}` : 'Pending assignment'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-sm">
                          {formatBDT(ord.orderSalesValue + ord.deliveryCharge)}
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openStatusChangeDialog(ord)}
                            className="px-2.5 py-1 rounded bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-semibold transition-colors"
                          >
                            Update Status
                          </button>
                          <button
                            onClick={() => setDetailModalOrder(ord)}
                            className="p-1 rounded bg-[#100D1B] border border-[#302741] hover:text-white text-[#C9C4D6]"
                            title="Inspect complete audit & timeline"
                          >
                            Details
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

      {/* Status Change Dialog Modal (with Reason, Courier, Tracking ID) */}
      {statusDialogOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#EC4899] tracking-wider">
                  Transition Order Stage
                </span>
                <h3 className="text-sm font-bold text-white">Order #{statusDialogOrder.id}</h3>
              </div>
              <button
                onClick={() => setStatusDialogOrder(null)}
                className="text-[#C9C4D6] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {statusSuccessMsg && (
              <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{statusSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmStatusChange} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-white mb-1">New Fulfillment Status (17 Choices)</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-semibold focus:border-[#7C3AED]"
                >
                  {ORDER_STATUS_CONFIG.map((cfg) => (
                    <option key={cfg.key} value={cfg.key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-white mb-1">Assigned Courier</label>
                  <select
                    value={statusCourier}
                    onChange={(e) => setStatusCourier(e.target.value)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Steadfast Logistics BD">Steadfast Logistics BD</option>
                    <option value="RedX Logistics">RedX Logistics</option>
                    <option value="Paperfly Express">Paperfly Express</option>
                    <option value="Pathao Courier">Pathao Courier</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-white mb-1">Courier Tracking ID</label>
                  <input
                    type="text"
                    value={statusTrackingId}
                    onChange={(e) => setStatusTrackingId(e.target.value)}
                    placeholder="e.g. STDF-881928"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white mb-1">Reason / Transition Memo</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Package inspected at central hub and handed over to Steadfast dispatch team..."
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-[#100D1B] border border-[#302741] text-[11px] text-[#C9C4D6] space-y-1">
                <div>Recipient: <strong className="text-white">{statusDialogOrder.customerName}</strong> ({statusDialogOrder.customerMobile})</div>
                <div>Destination: <span className="text-[#22D3EE]">{statusDialogOrder.customerUpazila}, {statusDialogOrder.customerDistrict}</span></div>
                <div>Automated Customer SMS notification will simulate delivery status update.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusDialogOrder(null)}
                  className="px-4 py-2 text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg shadow-md"
                >
                  {updatingStatus ? 'Applying Change...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {detailModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Full Dossier: #{detailModalOrder.id}</h3>
                <span className="text-xs text-[#22D3EE] font-mono">Invoice: {detailModalOrder.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setDetailModalOrder(null)}
                className="text-[#C9C4D6] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-[#100D1B] border border-[#302741] space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[#EC4899]">Customer Particulars</div>
                <div className="font-bold text-white">{detailModalOrder.customerName}</div>
                <div className="font-mono text-[#22D3EE]">{detailModalOrder.customerMobile}</div>
                <div className="text-[#C9C4D6]">{detailModalOrder.deliveryAddress}</div>
                <div className="text-white font-semibold">{detailModalOrder.customerUpazila}, {detailModalOrder.customerDistrict}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#100D1B] border border-[#302741] space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[#A855F7]">Financial Breakdown</div>
                <div className="flex justify-between">
                  <span>Wholesale Base:</span>
                  <span className="font-mono text-white">{formatBDT(detailModalOrder.supplierResellerPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reseller Sell Value:</span>
                  <span className="font-mono text-white">{formatBDT(detailModalOrder.orderSalesValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span className="font-mono text-white">{formatBDT(detailModalOrder.deliveryCharge)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#34D399] border-t border-[#302741] pt-1">
                  <span>Total COD Collectible:</span>
                  <span className="font-mono">{formatBDT(detailModalOrder.orderSalesValue + detailModalOrder.deliveryCharge)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Status Change History Trail</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {detailModalOrder.statusHistory?.map((h, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-[#100D1B] border border-[#302741] text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#22D3EE]">{h.status}</span>
                      <p className="text-[11px] text-[#C9C4D6]">{h.reason || 'Transition recorded'}</p>
                    </div>
                    <div className="text-right text-[10px] font-mono text-[#C9C4D6]/70">
                      <div>{formatBangladeshDateTime(h.timestamp)}</div>
                      <div>By: {h.changedBy} ({h.role})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#302741]">
              <button
                onClick={() => setDetailModalOrder(null)}
                className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-semibold rounded-lg"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
