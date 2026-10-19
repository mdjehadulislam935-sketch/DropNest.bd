import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Globe2,
  Mail,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Truck,
  Wallet
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { ApiCategory, ApiServiceItem } from '../../../types/platform.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface AllApiSettingModuleProps {
  initialSubmodule?: 'courier' | 'payment' | 'all' | 'sms' | 'extra';
}

export const AllApiSettingModule: React.FC<AllApiSettingModuleProps> = ({
  initialSubmodule = 'all',
}) => {
  const [submodule, setSubmodule] = useState<'courier' | 'payment' | 'all' | 'sms' | 'extra'>(initialSubmodule);
  const [apis, setApis] = useState<ApiServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; success: boolean } | null>(null);

  // Modal / Form state for Add/Edit API
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ApiCategory>('COURIER');
  const [formProvider, setFormProvider] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiSecret, setFormApiSecret] = useState('');
  const [formSenderId, setFormSenderId] = useState('');
  const [formTestMode, setFormTestMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchApis = async () => {
    setLoading(true);
    try {
      const list = await ApiService.getApiServices();
      setApis(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await ApiService.testApiService(id);
      setTestResult({ id, msg: res.message, success: true });
      await fetchApis();
    } catch (err: any) {
      setTestResult({ id, msg: err.message || 'Ping failed', success: false });
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formProvider) return;
    setSaving(true);
    try {
      const maskedKey = formApiKey.length > 8 ? `${formApiKey.slice(0, 4)}_live_********************${formApiKey.slice(-4)}` : 'key_live_********************';
      const maskedSecret = formApiSecret ? 'sec_live_********************' : undefined;

      await ApiService.saveApiService({
        name: formName,
        category: formCategory,
        provider: formProvider,
        baseUrl: formBaseUrl,
        apiKeyMasked: maskedKey,
        apiSecretMasked: maskedSecret,
        senderId: formSenderId || undefined,
        isTestMode: formTestMode,
        connectedModule: `${formCategory} Platform Service`,
      });

      setShowAddModal(false);
      setFormName('');
      setFormProvider('');
      setFormBaseUrl('');
      setFormApiKey('');
      setFormApiSecret('');
      setFormSenderId('');
      await fetchApis();
    } catch (err: any) {
      alert(err.message || 'Failed to save API');
    } finally {
      setSaving(false);
    }
  };

  // Filter APIs by category
  const displayedApis = apis.filter((a) => {
    if (submodule === 'courier') return a.category === 'COURIER';
    if (submodule === 'payment') return a.category === 'PAYMENT';
    if (submodule === 'sms') return a.category === 'SMS';
    if (submodule === 'extra') return ['EMAIL', 'WHATSAPP', 'PRODUCT_IMPORT', 'DOMAIN_DNS'].includes(a.category);
    return true; // 'all'
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">3. All API Setting & Service Integrations</h2>
            <p className="text-xs text-[#C9C4D6]">
              Real-time gateway credentials, webhooks, ping test diagnostics, and health monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect New API</span>
          </button>

          <button
            onClick={fetchApis}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh APIs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Submodule Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741]">
        <button
          onClick={() => setSubmodule('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'all' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          5.3 All Connected APIs ({apis.length})
        </button>
        <button
          onClick={() => setSubmodule('courier')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'courier' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          5.1 Courier APIs
        </button>
        <button
          onClick={() => setSubmodule('payment')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'payment' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          5.2 Payment Gateways
        </button>
        <button
          onClick={() => setSubmodule('sms')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'sms' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          5.4 SMS Services
        </button>
        <button
          onClick={() => setSubmodule('extra')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${submodule === 'extra' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'}`}
        >
          5.5 Email / WhatsApp / DNS
        </button>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            testResult.success
              ? 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]'
              : 'bg-[#F87171]/15 border-[#F87171]/30 text-[#F87171]'
          }`}
        >
          {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{testResult.msg}</span>
        </div>
      )}

      {/* Grid of APIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedApis.map((api) => (
          <div key={api.id} className="bg-[#171226] border border-[#302741] p-5 rounded-xl flex flex-col justify-between hover:border-[#7C3AED]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#302741] text-[#22D3EE]">
                  {api.category}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                  {api.healthStatus}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{api.name}</h4>
              <p className="text-xs text-[#C9C4D6] mt-0.5">Provider: {api.provider}</p>

              <div className="mt-3 p-2.5 rounded-lg bg-[#100D1B] border border-[#302741] text-xs space-y-1 font-mono">
                <div className="text-[#C9C4D6] truncate text-[11px]">Endpoint: {api.baseUrl || 'https://api.provider.com'}</div>
                <div className="text-[#22D3EE] text-[11px] truncate">API Key: {api.apiKeyMasked}</div>
                {api.senderId && <div className="text-[#A855F7] text-[11px]">Sender ID: {api.senderId}</div>}
              </div>

              <div className="mt-2 text-[10px] text-[#C9C4D6]/70">
                Last connection: {formatBangladeshDateTime(api.lastConnection)}
              </div>
            </div>

            <div className="pt-3 border-t border-[#302741] mt-3 flex items-center justify-between">
              <span className="text-[11px] text-white">Mode: <strong className="text-[#34D399]">{api.isTestMode ? 'SANDBOX' : 'PRODUCTION'}</strong></span>
              <button
                type="button"
                onClick={() => handleTestConnection(api.id)}
                disabled={testingId === api.id}
                className="px-3 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
              >
                <Activity className={`w-3.5 h-3.5 ${testingId === api.id ? 'animate-spin' : ''}`} />
                <span>{testingId === api.id ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add API Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configure API Integration</h3>

            <form onSubmit={handleSaveApi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Integration Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. SSLCommerz Payment Gateway"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="COURIER">COURIER</option>
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">EMAIL</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="PRODUCT_IMPORT">PRODUCT_IMPORT</option>
                    <option value="DOMAIN_DNS">DOMAIN_DNS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Provider Company</label>
                  <input
                    type="text"
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    placeholder="e.g. SSL Wireless"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Base Endpoint URL</label>
                <input
                  type="url"
                  value={formBaseUrl}
                  onChange={(e) => setFormBaseUrl(e.target.value)}
                  placeholder="https://securepay.sslcommerz.com/gwprocess/v4/api.php"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">API Key / Store ID</label>
                  <input
                    type="text"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="live_store_id"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">API Secret Password</label>
                  <input
                    type="password"
                    value={formApiSecret}
                    onChange={(e) => setFormApiSecret(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
