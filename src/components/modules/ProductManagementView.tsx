import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';
import { ApiService } from '../../services/api.ts';
import type { ProductItem } from '../../types/platform.ts';
import { formatBDT } from '../../utils/formatters.ts';
import { ProductCard } from '../common/ProductCard.tsx';

interface ProductManagementViewProps {
  filterStatus?: 'ALL' | 'PENDING_APPROVAL' | 'APPROVED';
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  filterStatus = 'ALL',
}) => {
  const { user } = useAuth();
  const { openTab } = useTabs();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED'>(filterStatus);

  // New Product Submission Modal State (for Suppliers)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Consumer Electronics');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formRetailPrice, setFormRetailPrice] = useState('');
  const [formStock, setFormStock] = useState('50');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user?.role]);

  const handleApproveProduct = async (id: string) => {
    try {
      const updated = await ApiService.updateProductStatus(id, 'APPROVED');
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectProduct = async (id: string) => {
    try {
      const updated = await ApiService.updateProductStatus(id, 'REJECTED');
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSku || !formBasePrice) {
      setSubmitError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await ApiService.createProduct({
        name: formName.trim(),
        sku: formSku.trim(),
        category: formCategory,
        basePrice: parseFloat(formBasePrice),
        suggestedRetailPrice: formRetailPrice ? parseFloat(formRetailPrice) : parseFloat(formBasePrice) * 1.3,
        stockQuantity: parseInt(formStock, 10) || 0,
        description: formDescription.trim(),
        specifications: {
          'Origin': 'Bangladesh Verified Warehouse',
          'Warranty': '7 Days DropNest Replacement',
        },
      });

      setShowSubmitModal(false);
      setFormName('');
      setFormSku('');
      setFormBasePrice('');
      setFormRetailPrice('');
      setFormDescription('');
      await fetchProducts();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit product');
    } finally {
      setSubmitting(false);
    }
  };

  const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user?.role || '');
  const isSupplier = user?.role === 'SUPPLIER';
  const isReseller = user?.role === 'RESELLER';

  const categories = ['ALL', 'Consumer Electronics', 'Fashion & Apparel', 'Home & Kitchen', 'Beauty & Personal Care', 'Gadgets & Accessories'];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesQuery && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#A855F7]" />
            <span>
              {isPrivileged
                ? 'Product Moderation & Master Catalog'
                : isSupplier
                ? 'Supplier Product Inventory'
                : 'Approved Product Catalog for Resellers'}
            </span>
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            Every product card features dedicated icon-only Copy and Download buttons for instant spec export
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSupplier && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Product</span>
            </button>
          )}

          <button
            onClick={fetchProducts}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh product list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#100D1B] p-3 rounded-xl border border-[#302741]">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A855F7]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title or SKU..."
              className="w-full bg-[#171226] border border-[#302741] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#171226] border border-[#302741] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {isPrivileged && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#171226] border border-[#302741] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved Only</option>
            </select>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#C9C4D6]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED] mb-2" />
          <span>Loading verified catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#171226] border border-[#302741] p-12 rounded-xl text-center flex flex-col items-center">
          <Package className="w-12 h-12 text-[#302741] mb-3" />
          <h4 className="text-base font-bold text-white">No Products In Catalog</h4>
          <p className="text-xs text-[#C9C4D6] max-w-md mt-1">
            {isSupplier
              ? 'Click "Submit New Product" above to list your factory items for DropNest approval.'
              : isReseller
              ? 'No approved products currently match your filter. Check back once suppliers list new inventory.'
              : 'No products submitted yet. When suppliers submit items, they will appear here for your approval.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex flex-col">
              <ProductCard
                product={product}
                userRole={user?.role}
                onActionClick={
                  isReseller && product.status === 'APPROVED'
                    ? (p) =>
                        openTab({
                          id: `order-create-${p.id}`,
                          title: `Order: ${p.sku}`,
                          viewId: 'create-order',
                          params: { productId: p.id },
                          isClosable: true,
                        })
                    : undefined
                }
                actionLabel={isReseller ? 'Place Order' : undefined}
              />

              {/* Privileged Approval Action Controls for Staff */}
              {isPrivileged && product.status === 'PENDING_APPROVAL' && (
                <div className="mt-2 p-2 rounded-lg bg-[#100D1B] border border-[#302741] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#FBBF24] font-semibold">Action Needed</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApproveProduct(product.id)}
                      className="px-2.5 py-1 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectProduct(product.id)}
                      className="px-2.5 py-1 bg-[#F87171]/20 hover:bg-[#F87171] text-[#F87171] hover:text-black text-xs font-semibold rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Supplier Submit Product Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-[#C9C4D6] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Submit Product Specification</h3>
            <p className="text-xs text-[#C9C4D6] mb-4">
              Submitted products require compliance verification before appearing in the Reseller catalog.
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-lg bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Product Title <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wireless Noise-Cancelling Earbuds Pro"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    SKU Identifier <span className="text-[#F87171]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    placeholder="e.g. DN-EAR-01"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {categories.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Base Wholesale (BDT) <span className="text-[#F87171]">*</span>
                  </label>
                  <input
                    type="number"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    placeholder="1200"
                    min="1"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Suggested Retail (BDT)
                  </label>
                  <input
                    type="number"
                    value={formRetailPrice}
                    onChange={(e) => setFormRetailPrice(e.target.value)}
                    placeholder="1650"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="50"
                    min="0"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Technical specifications, packaging details, and warranty terms..."
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : 'Submit For Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
