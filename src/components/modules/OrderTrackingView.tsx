import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  Truck,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiService } from '../../services/api.ts';
import type { OrderItem, OrderStatus } from '../../types/platform.ts';
import { formatBangladeshDateTime, formatBDT } from '../../utils/formatters.ts';

export const OrderTrackingView: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await ApiService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSelectedOrder(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user?.role || '');
  const isSupplier = user?.role === 'SUPPLIER';
  const isReseller = user?.role === 'RESELLER';

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      o.id.toLowerCase().includes(q) ||
      o.invoiceNumber.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      (isPrivileged && o.resellerName.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Title & Filters */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#22D3EE]" />
            <span>
              {isSupplier
                ? 'Company Orders & Fulfillment Queue'
                : isReseller
                ? 'Reseller Store Orders'
                : 'Master Platform Order Surveillance'}
            </span>
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            {isSupplier
              ? 'Authorized fulfillment items for company preparation and delivery'
              : isReseller
              ? 'Real-time parcel delivery status and customer tracking'
              : 'End-to-end full pricing breakdown, reseller-supplier audit, and courier history'}
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A855F7]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Invoice, SKU..."
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh order records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Order Workspace Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders Table / List */}
        <div className="lg:col-span-2 bg-[#171226] border border-[#302741] rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#302741] flex items-center justify-between bg-[#100D1B]">
            <span className="text-xs font-semibold text-white">
              All Orders ({filteredOrders.length})
            </span>
            <div className="flex items-center gap-1">
              {['ALL', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 text-[11px] rounded transition-colors ${
                    statusFilter === st
                      ? 'bg-[#7C3AED] text-white font-medium'
                      : 'text-[#C9C4D6] hover:bg-[#302741]/50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#C9C4D6]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED] mb-2" />
              <span>Loading order records from DropNest ledger...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-[#C9C4D6]">
              <ShoppingBag className="w-10 h-10 mx-auto text-[#302741] mb-2" />
              <p className="text-sm font-semibold text-white">No Orders Placed Yet</p>
              <p className="text-xs text-[#C9C4D6]/70 mt-1">
                {isReseller
                  ? 'Browse the product catalog and place your first store order.'
                  : isSupplier
                  ? 'Orders from DropNest official reseller network will appear here once placed.'
                  : 'Orders created by active resellers will appear in this real-time ledger.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#C9C4D6]">
                <thead className="bg-[#080611] text-[#FFFFFF] uppercase text-[10px] tracking-wider border-b border-[#302741]">
                  <tr>
                    <th className="px-3 py-2.5">Order / Invoice</th>
                    <th className="px-3 py-2.5">Product & Qty</th>
                    <th className="px-3 py-2.5">Status</th>
                    {isPrivileged && <th className="px-3 py-2.5">Reseller / Supplier</th>}
                    <th className="px-3 py-2.5 text-right">Value (BDT)</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-[#100D1B] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#7C3AED]/10 border-l-2 border-l-[#7C3AED]' : ''
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="font-mono font-bold text-white">{order.id}</div>
                          <div className="text-[10px] text-[#22D3EE]">{order.invoiceNumber}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-white line-clamp-1">{order.productName}</div>
                          <div className="text-[10px] text-[#C9C4D6]">
                            Qty: <strong className="text-white font-mono">{order.quantity}</strong> · SKU: {order.sku}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              order.status === 'DELIVERED'
                                ? 'bg-[#34D399]/20 text-[#34D399]'
                                : order.status === 'PROCESSING' || order.status === 'CONFIRMED'
                                ? 'bg-[#FBBF24]/20 text-[#FBBF24]'
                                : 'bg-[#22D3EE]/20 text-[#22D3EE]'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        {isPrivileged && (
                          <td className="px-3 py-3 text-[11px]">
                            <div>
                              R: <span className="text-[#A855F7] font-semibold">{order.resellerName}</span>
                            </div>
                            <div>
                              S: <span className="text-[#22D3EE]">{order.supplierName}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-3 text-right font-mono font-bold text-white tabular-nums">
                          {formatBDT(isSupplier ? order.supplierResellerPrice * order.quantity : order.orderSalesValue)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="p-1 rounded bg-[#302741] hover:bg-[#7C3AED] text-white transition-colors"
                            title="Inspect order details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Order Detail Panel with STRICT Role Visibility Rules */}
        <div className="bg-[#171226] border border-[#302741] rounded-xl p-4 flex flex-col justify-between">
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="border-b border-[#302741] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#C9C4D6]/70">
                    Order Inspection
                  </span>
                  <h4 className="text-base font-bold text-white font-mono">{selectedOrder.id}</h4>
                  <p className="text-[11px] text-[#22D3EE]">{selectedOrder.invoiceNumber}</p>
                </div>

                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40">
                  {selectedOrder.status}
                </span>
              </div>

              {/* Product Information */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-[#A855F7] uppercase tracking-wider">
                  Product Details
                </div>
                <div className="p-2.5 rounded-lg bg-[#100D1B] border border-[#302741] space-y-1">
                  <p className="font-semibold text-white">{selectedOrder.productName}</p>
                  <p className="text-[#C9C4D6]">
                    SKU: <span className="font-mono text-[#22D3EE]">{selectedOrder.sku}</span> · Quantity:{' '}
                    <span className="font-mono text-white font-bold">{selectedOrder.quantity}</span>
                  </p>
                </div>
              </div>

              {/* Financial & Pricing Breakdown (Role-Sensitive) */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-[#22D3EE] uppercase tracking-wider">
                  Pricing & Settlement
                </div>
                <div className="p-2.5 rounded-lg bg-[#100D1B] border border-[#302741] space-y-1 text-xs">
                  {isPrivileged && (
                    <>
                      <div className="flex justify-between">
                        <span>Supplier Reseller Price:</span>
                        <span className="font-mono text-white tabular-nums">
                          {formatBDT(selectedOrder.supplierResellerPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reseller Sell Price:</span>
                        <span className="font-mono text-white tabular-nums">
                          {formatBDT(selectedOrder.resellerSellPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Charge:</span>
                        <span className="font-mono text-white tabular-nums">
                          {formatBDT(selectedOrder.deliveryCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#302741] font-bold text-[#34D399]">
                        <span>Total Sales Value:</span>
                        <span className="font-mono tabular-nums">
                          {formatBDT(selectedOrder.orderSalesValue + selectedOrder.deliveryCharge)}
                        </span>
                      </div>
                    </>
                  )}

                  {isSupplier && (
                    <>
                      <div className="flex justify-between">
                        <span>Order Type:</span>
                        <span className="text-[#22D3EE] font-semibold">DropNest Platform Company Order</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fulfillment Quantity:</span>
                        <span className="font-mono text-white">{selectedOrder.quantity} units</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#34D399]">
                        <span>Payable Settlement:</span>
                        <span className="font-mono tabular-nums">
                          {formatBDT(selectedOrder.supplierResellerPrice * selectedOrder.quantity)}
                        </span>
                      </div>
                    </>
                  )}

                  {isReseller && (
                    <>
                      <div className="flex justify-between">
                        <span>Your Sell Price (ea):</span>
                        <span className="font-mono text-white tabular-nums">
                          {formatBDT(selectedOrder.resellerSellPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className="font-mono text-white tabular-nums">
                          {formatBDT(selectedOrder.deliveryCharge)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-[#34D399]">
                        <span>Total Order Value:</span>
                        <span className="font-mono tabular-nums">
                          {formatBDT(selectedOrder.orderSalesValue + selectedOrder.deliveryCharge)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stakeholder Details (Strict Supplier Isolation Enforced) */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[11px] font-semibold text-[#EC4899] uppercase tracking-wider">
                  Stakeholders & Delivery
                </div>
                <div className="p-2.5 rounded-lg bg-[#100D1B] border border-[#302741] space-y-1 text-xs">
                  {/* SUPPLIER ISOLATION: NEVER REVEAL RESELLER OR CUSTOMER PRIVATE INFO TO SUPPLIER */}
                  {isSupplier ? (
                    <div className="text-[#C9C4D6] space-y-1">
                      <p>
                        Client / Channel:{' '}
                        <span className="text-white font-semibold">
                          DropNest Central Fulfillment System
                        </span>
                      </p>
                      <p>
                        Destination Division / Hub:{' '}
                        <span className="text-[#22D3EE] font-semibold">
                          {selectedOrder.customerDistrict} Dispatch Hub
                        </span>
                      </p>
                      <p className="text-[11px] text-[#C9C4D6]/70 italic">
                        Customer & Reseller private identity protected under DropNest Security Policy.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-[#C9C4D6]">
                      <p>
                        Customer: <strong className="text-white">{selectedOrder.customerName}</strong> (
                        <span className="font-mono text-[#22D3EE]">{selectedOrder.customerMobile}</span>)
                      </p>
                      <p>
                        Address:{' '}
                        <span className="text-white">
                          {selectedOrder.deliveryAddress}, {selectedOrder.customerUpazila},{' '}
                          {selectedOrder.customerDistrict}
                        </span>
                      </p>
                      {isPrivileged && (
                        <p className="pt-1 border-t border-[#302741] text-[11px]">
                          Reseller Store:{' '}
                          <span className="text-[#A855F7] font-semibold">
                            {selectedOrder.resellerStoreName}
                          </span>{' '}
                          (ID: {selectedOrder.resellerId})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Controls for Authorized Staff / Suppliers */}
              {(isPrivileged || isSupplier) && (
                <div className="pt-2 border-t border-[#302741]">
                  <label className="block text-[11px] font-semibold text-white mb-1.5">
                    Update Order Status
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingStatus || selectedOrder.status === st}
                        onClick={() => handleUpdateStatus(selectedOrder.id, st as OrderStatus)}
                        className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                          selectedOrder.status === st
                            ? 'bg-[#302741] text-[#C9C4D6] cursor-default'
                            : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'
                        }`}
                      >
                        Set {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-[#C9C4D6]">
              <Package className="w-8 h-8 mx-auto text-[#302741] mb-2" />
              <span>Select an order from the list to view role-authorized details and tracking history.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
