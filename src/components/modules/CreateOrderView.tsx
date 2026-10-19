import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Package, ShoppingCart, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';
import { ApiService } from '../../services/api.ts';
import type { ProductItem } from '../../types/platform.ts';
import { formatBDT, isValidBangladeshMobile } from '../../utils/formatters.ts';
import { BangladeshLocationSelect } from '../common/BangladeshLocationSelect.tsx';

interface CreateOrderViewProps {
  initialProductId?: string;
}

export const CreateOrderView: React.FC<CreateOrderViewProps> = ({ initialProductId }) => {
  const { user } = useAuth();
  const { openTab } = useTabs();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || '');
  const [quantity, setQuantity] = useState(1);
  const [resellerSellPrice, setResellerSellPrice] = useState<string>('');
  const [deliveryCharge] = useState(120); // ৳ 120 standard courier fee
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerDistrict, setCustomerDistrict] = useState('Dhaka');
  const [customerUpazila, setCustomerUpazila] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const list = await ApiService.getProducts();
        // Resellers can only place orders on approved items
        const approved = list.filter((p) => p.status === 'APPROVED');
        setProducts(approved);
        if (approved.length > 0 && !selectedProductId) {
          setSelectedProductId(approved[0].id);
          setResellerSellPrice(String(approved[0].suggestedRetailPrice));
        }
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Update sell price preset when product changes
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setResellerSellPrice(String(prod.suggestedRetailPrice));
    }
  };

  const sellPriceNum = parseFloat(resellerSellPrice) || 0;
  const wholesalePriceNum = selectedProduct ? selectedProduct.basePrice : 0;
  const estimatedProfit = selectedProduct ? (sellPriceNum - wholesalePriceNum) * quantity : 0;
  const totalCustomerPayable = sellPriceNum * quantity + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError('Please choose an approved product.');
      return;
    }
    if (!isValidBangladeshMobile(customerMobile)) {
      setError('Please provide a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).');
      return;
    }
    if (!customerDistrict || !customerUpazila) {
      setError('Please select both a valid District and Upazila.');
      return;
    }
    if (sellPriceNum < wholesalePriceNum) {
      setError(`Reseller sell price cannot be lower than base wholesale price (${formatBDT(wholesalePriceNum)}).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const order = await ApiService.createOrder({
        productId: selectedProductId,
        quantity,
        resellerSellPrice: sellPriceNum,
        deliveryCharge,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        customerDistrict,
        customerUpazila,
        deliveryAddress: deliveryAddress.trim(),
      });

      setSuccessOrder(order);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#C9C4D6]">Loading approved products...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#171226] border border-[#302741] p-12 rounded-xl text-center max-w-xl mx-auto">
        <Package className="w-12 h-12 text-[#302741] mx-auto mb-3" />
        <h4 className="text-base font-bold text-white">No Approved Products Available</h4>
        <p className="text-xs text-[#C9C4D6] mt-1">
          No supplier products have been approved yet. Once verified by administrators, products will be available here for dropship orders.
        </p>
      </div>
    );
  }

  if (successOrder) {
    return (
      <div className="bg-[#171226] border border-[#302741] p-8 rounded-xl max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white">Order Placed Successfully</h3>
        <p className="text-xs text-[#C9C4D6]">
          Order <span className="font-mono text-[#22D3EE] font-bold">{successOrder.id}</span> has been dispatched to central logistics.
        </p>

        <div className="p-4 rounded-lg bg-[#100D1B] border border-[#302741] text-xs text-left space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-[#C9C4D6]">Invoice:</span>
            <span className="text-white font-bold">{successOrder.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C9C4D6]">Customer:</span>
            <span className="text-white">{successOrder.customerName} ({successOrder.customerMobile})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C9C4D6]">Destination:</span>
            <span className="text-white">{successOrder.customerUpazila}, {successOrder.customerDistrict}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C9C4D6]">Total Sales Value:</span>
            <span className="text-[#34D399] font-bold">{formatBDT(successOrder.orderSalesValue + successOrder.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#C9C4D6]">Assigned Courier:</span>
            <span className="text-[#22D3EE]">{successOrder.courierName}</span>
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => {
              setSuccessOrder(null);
              setCustomerName('');
              setCustomerMobile('');
              setDeliveryAddress('');
            }}
            className="px-4 py-2 rounded-lg bg-[#302741] hover:bg-[#302741]/70 text-xs text-white"
          >
            Create Another Order
          </button>
          <button
            onClick={() =>
              openTab({
                id: 'reseller-orders',
                title: 'Order Tracking',
                viewId: 'orders',
                isClosable: true,
              })
            }
            className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-bold text-white"
          >
            Track in Orders List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#22D3EE]" />
            <span>Create New Customer Dropship Order</span>
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            Fulfill orders directly to your customers anywhere across Bangladesh with full profit settlement
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Product Selection & Pricing */}
        <div className="md:col-span-2 space-y-4">
          {/* Product Picker */}
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#A855F7] uppercase tracking-wider">
              1. Product & Pricing Configuration
            </h4>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Select Approved Product <span className="text-[#F87171]">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku}) — Wholesale: {formatBDT(p.basePrice)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Quantity <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min="1"
                  max={selectedProduct?.stockQuantity || 999}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Your Selling Price (BDT each) <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="number"
                  value={resellerSellPrice}
                  onChange={(e) => setResellerSellPrice(e.target.value)}
                  min={wholesalePriceNum}
                  placeholder="1500"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Customer & Shipping Information */}
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
              2. Bangladesh Customer & Shipping Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Customer Full Name <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Asif Mahmud"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Customer Mobile Number (11-digit BD) <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="text"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>
            </div>

            {/* MANDATORY DEPENDENT BANGLADESH LOCATION SELECTOR */}
            <BangladeshLocationSelect
              selectedDistrict={customerDistrict}
              selectedUpazila={customerUpazila}
              onDistrictChange={setCustomerDistrict}
              onUpazilaChange={setCustomerUpazila}
              required={true}
            />

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Detailed Delivery Street / House Address <span className="text-[#F87171]">*</span>
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                placeholder="House #, Road #, Sector / Area details..."
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-xs text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column: Financial Calculation & Settlement Summary */}
        <div className="space-y-4">
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#34D399] uppercase tracking-wider">
              Financial Breakdown
            </h4>

            <div className="space-y-2 text-xs text-[#C9C4D6]">
              <div className="flex justify-between">
                <span>Wholesale Base Price:</span>
                <span className="font-mono text-white tabular-nums">{formatBDT(wholesalePriceNum)}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-mono text-white tabular-nums">{quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span>Total Wholesale Cost:</span>
                <span className="font-mono text-white tabular-nums">{formatBDT(wholesalePriceNum * quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Selling Price:</span>
                <span className="font-mono text-[#22D3EE] tabular-nums">{formatBDT(sellPriceNum * quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Delivery Fee:</span>
                <span className="font-mono text-white tabular-nums">{formatBDT(deliveryCharge)}</span>
              </div>

              <div className="pt-2 border-t border-[#302741] flex justify-between font-bold text-white text-sm">
                <span>Customer Payable:</span>
                <span className="font-mono text-[#22D3EE] tabular-nums">{formatBDT(totalCustomerPayable)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 flex justify-between items-center text-xs text-[#34D399] font-bold">
                <span>Estimated Reseller Margin:</span>
                <span className="font-mono text-sm tabular-nums">+{formatBDT(estimatedProfit)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Truck className="w-4 h-4" />
              <span>{submitting ? 'Confirming with Logistics...' : 'Place Dropship Order'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
