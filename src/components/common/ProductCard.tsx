import React, { useState } from 'react';
import { Check, Copy, Download, Package } from 'lucide-react';
import type { ProductItem, UserRole } from '../../types/platform.ts';
import { formatBDT } from '../../utils/formatters.ts';

interface ProductCardProps {
  product: ProductItem;
  userRole?: UserRole;
  onActionClick?: (product: ProductItem) => void;
  actionLabel?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  userRole = 'RESELLER',
  onActionClick,
  actionLabel,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Copy Permitted Product Information
  const handleCopy = async () => {
    try {
      const copyContent = `Product: ${product.name}
SKU: ${product.sku}
Category: ${product.category}
Price: ${formatBDT(product.suggestedRetailPrice || product.basePrice)}
Specifications: ${Object.entries(product.specifications || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')}
Platform: DropNest Bangladesh`;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyContent);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = copyContent;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Download Permitted Product Information Asset
  const handleDownload = () => {
    try {
      const exportData = {
        platform: 'DropNest Bangladesh Dropshipping',
        exportDate: new Date().toISOString(),
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          suggestedRetailPriceBDT: product.suggestedRetailPrice,
          baseResellerPriceBDT: userRole !== 'RESELLER' ? product.basePrice : undefined,
          stockStatus: product.stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          description: product.description,
          specifications: product.specifications,
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      // Meaningful filename: e.g. DN-SKU1234_product_spec.json
      const sanitizedSku = product.sku.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadAnchor.setAttribute('download', `DropNest_${sanitizedSku}_product_spec.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to download product spec', err);
    }
  };

  return (
    <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden hover:border-[#7C3AED]/50 transition-all flex flex-col relative group">
      {/* Product Image / Placeholder */}
      <div className="w-full h-44 bg-[#100D1B] border-b border-[#302741] flex items-center justify-center relative overflow-hidden">
        <Package className="w-12 h-12 text-[#302741] group-hover:text-[#A855F7] transition-colors" />

        {/* Status Tag */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              product.status === 'APPROVED'
                ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30'
                : product.status === 'PENDING_APPROVAL'
                ? 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30'
                : 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30'
            }`}
          >
            {product.status.replace('_', ' ')}
          </span>
        </div>

        {/* Stock status indicator */}
        <div className="absolute bottom-2 left-2.5 text-[11px] text-[#C9C4D6]">
          Stock: <span className="font-mono tabular-nums text-white font-medium">{product.stockQuantity}</span>
        </div>

        {/* EXACTLY TWO DEDICATED ICON-ONLY ACTION BUTTONS: COPY AND DOWNLOAD */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {/* Copy Button (Icon Only, No text label, accessible name & tooltip) */}
          <button
            type="button"
            onClick={handleCopy}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all ${
              copySuccess
                ? 'bg-[#34D399] text-black border-[#34D399]'
                : 'bg-[#0D0A17]/80 text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#7C3AED] border-[#302741]'
            }`}
            title="Copy permitted product info to clipboard"
            aria-label="Copy permitted product info"
          >
            {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Button (Icon Only, No text label, accessible name & tooltip) */}
          <button
            type="button"
            onClick={handleDownload}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all ${
              downloadSuccess
                ? 'bg-[#22D3EE] text-black border-[#22D3EE]'
                : 'bg-[#0D0A17]/80 text-[#C9C4D6] hover:text-[#FFFFFF] hover:bg-[#7C3AED] border-[#302741]'
            }`}
            title="Download product specification"
            aria-label="Download product specification"
          >
            {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-[#C9C4D6]/70 mb-1">
            <span className="truncate">{product.category}</span>
            <span className="font-mono text-[11px] text-[#22D3EE] font-medium">{product.sku}</span>
          </div>

          <h4 className="text-sm font-semibold text-[#FFFFFF] line-clamp-1 group-hover:text-[#A855F7] transition-colors">
            {product.name}
          </h4>

          <p className="text-xs text-[#C9C4D6] mt-1.5 line-clamp-2 leading-relaxed">
            {product.description || 'No description provided.'}
          </p>
        </div>

        {/* Pricing Breakdown */}
        <div className="mt-4 pt-3 border-t border-[#302741] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#C9C4D6]/70">
              {userRole === 'RESELLER' ? 'Suggested Retail' : 'Wholesale / Base'}
            </div>
            <div className="text-base font-bold text-[#FFFFFF] font-mono tabular-nums">
              {formatBDT(userRole === 'RESELLER' ? product.suggestedRetailPrice : product.basePrice)}
            </div>
          </div>

          {onActionClick && actionLabel && (
            <button
              type="button"
              onClick={() => onActionClick(product)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
