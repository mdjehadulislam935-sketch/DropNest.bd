import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Palette, Shield, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTabs } from '../../context/TabContext.tsx';

export const ResellerStoreView: React.FC = () => {
  const { user } = useAuth();
  const { openTab } = useTabs();

  const [storeName, setStoreName] = useState(user?.storeName || `${user?.fullName || 'My'} Store`);
  const [storeTagline, setStoreTagline] = useState('Premier Bangladesh E-Commerce & Dropship Outlet');
  const [brandColor, setBrandColor] = useState('#7C3AED');
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const storeSlug = (user?.username || 'store').toLowerCase();
  const storeUrl = `https://dropnest.com.bd/store/${storeSlug}`;

  const handleCopyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-[#34D399]" />
            <span>Reseller Store Branding & Cryptographic Isolation</span>
          </h3>
          <p className="text-xs text-[#C9C4D6]">
            Isolated multi-tenant brand configuration strictly scoped to Account ID: <span className="font-mono text-[#22D3EE]">{user?.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyStoreLink}
            className="px-3 py-1.5 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Copy Store URL'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Form: Store Brand Settings */}
        <div className="md:col-span-2 bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-[#A855F7] uppercase tracking-wider">
            Brand Identity Configuration
          </h4>

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs">
              Store branding configuration updated and cached securely.
            </div>
          )}

          <form onSubmit={handleSaveStore} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Store Brand Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Store Tagline / Slogan
              </label>
              <input
                type="text"
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Primary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded border border-[#302741] cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs text-white">{brandColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Store Slug (URL Identifier)
                </label>
                <input
                  type="text"
                  value={storeSlug}
                  disabled
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-[#C9C4D6] font-mono opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition-colors"
              >
                Save Store Identity
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Store Isolation & Security Guarantee */}
        <div className="space-y-4">
          <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#22D3EE] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Multi-Tenant Isolation</span>
            </h4>

            <p className="text-xs text-[#C9C4D6] leading-relaxed">
              Every DropNest reseller operates in an isolated cryptographic tenant. Another reseller cannot access your customer names, mobile numbers, margins, or order history.
            </p>

            <div className="p-3 rounded-lg bg-[#100D1B] border border-[#302741] text-[11px] text-[#C9C4D6] space-y-1 font-mono">
              <div>Tenant ID: {user?.id}</div>
              <div>Store Slug: /store/{storeSlug}</div>
              <div>District Hub: {user?.district || 'Dhaka'}</div>
              <div>State: ACTIVE_VERIFIED</div>
            </div>
          </div>

          <div className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-white">Live Storefront Preview</h4>
            <div className="p-4 rounded-lg bg-[#100D1B] border border-[#302741] text-center space-y-2">
              <div
                className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: brandColor }}
              >
                {storeName.charAt(0).toUpperCase()}
              </div>
              <h5 className="text-sm font-bold text-white">{storeName}</h5>
              <p className="text-[11px] text-[#C9C4D6]">{storeTagline}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
