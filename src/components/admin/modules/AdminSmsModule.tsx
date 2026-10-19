import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import { BANGLADESH_DISTRICTS } from '../../../data/bangladeshLocations.ts';
import { ApiService } from '../../../services/api.ts';
import { formatBDT, formatBangladeshDateTime } from '../../../utils/formatters.ts';
import type { AdminPermissions, AdminSmsMetrics } from '../../../types/admin.ts';
import type { SmsLogRecord } from '../../../types/platform.ts';

interface AdminSmsModuleProps {
  initialSubmodule?: string;
}

export const AdminSmsModule: React.FC<AdminSmsModuleProps> = ({ initialSubmodule }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRIGGERS' | 'BULK' | 'LOGS'>(() => {
    if (initialSubmodule === 'Automated Triggers') return 'TRIGGERS';
    if (initialSubmodule === 'Bulk Broadcast') return 'BULK';
    if (initialSubmodule === 'SMS History') return 'LOGS';
    return 'DASHBOARD';
  });

  const [smsMetrics, setSmsMetrics] = useState<AdminSmsMetrics | null>(null);
  const [smsLogs, setSmsLogs] = useState<SmsLogRecord[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Bulk SMS Form state
  const [targetGroup, setTargetGroup] = useState<'ALL_RESELLERS' | 'ALL_SUPPLIERS' | 'DISTRICT' | 'CUSTOM'>('ALL_RESELLERS');
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka');
  const [customNumbersInput, setCustomNumbersInput] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Search in logs
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'ALL' | 'DELIVERED' | 'PENDING' | 'FAILED'>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, permRes] = await Promise.all([
        ApiService.getAdminSmsDashboard(),
        ApiService.getAdminPermissions(),
      ]);
      setSmsMetrics(dashRes.sms);
      setSmsLogs(dashRes.logs);
      setPermissions(permRes);
    } catch (err: any) {
      console.error('Failed to load SMS data:', err);
      setFeedback({ text: 'Failed to fetch SMS records from gateway server.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check Unicode/Bangla vs GSM (English)
  const isUnicode = (text: string) => {
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) > 127) return true;
    }
    return false;
  };

  // SMS parts calculation
  const charCount = messageText.length;
  const isBanglaOrUnicode = isUnicode(messageText);
  let smsParts = 1;
  let maxPerPart = isBanglaOrUnicode ? 70 : 160;

  if (isBanglaOrUnicode) {
    if (charCount > 70) {
      smsParts = Math.ceil(charCount / 67);
      maxPerPart = 67;
    }
  } else {
    if (charCount > 160) {
      smsParts = Math.ceil(charCount / 153);
      maxPerPart = 153;
    }
  }

  // Toggle Automated Trigger
  const handleToggleTrigger = async (triggerKey: string, currentVal: boolean) => {
    try {
      const updated = await ApiService.toggleSmsTrigger(triggerKey, !currentVal);
      if (smsMetrics) {
        setSmsMetrics({ ...smsMetrics, automatedTriggers: updated });
      }
      setFeedback({
        text: `Trigger "${triggerKey.replace(/_/g, ' ')}" updated to ${!currentVal ? 'ENABLED' : 'DISABLED'}.`,
      });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Trigger update failed.', isError: true });
    }
  };

  // Dispatch Bulk SMS
  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setFeedback({ text: 'SMS message body cannot be blank.', isError: true });
      return;
    }

    if (!permissions?.canSendSms) {
      setFeedback({
        text: 'Permission Denied: You do not have authorization to dispatch SMS broadcasts. Contact Super Admin.',
        isError: true,
      });
      return;
    }

    const customNumbers =
      targetGroup === 'CUSTOM'
        ? customNumbersInput
            .split(/[\n,;]+/)
            .map((n) => n.trim())
            .filter((n) => n.length >= 10)
        : undefined;

    if (targetGroup === 'CUSTOM' && (!customNumbers || customNumbers.length === 0)) {
      setFeedback({ text: 'Please enter at least one valid mobile number.', isError: true });
      return;
    }

    setIsSending(true);
    try {
      const targetLabel = targetGroup === 'DISTRICT' ? `District: ${selectedDistrict}` : targetGroup;
      const res = await ApiService.sendAdminBulkSms({
        targetGroup: targetLabel,
        message: messageText,
        customNumbers,
      });

      setFeedback({
        text: `SMS broadcast dispatched successfully to ${res.count} recipient(s).`,
      });
      setMessageText('');
      setCustomNumbersInput('');
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to dispatch bulk SMS.', isError: true });
    } finally {
      setIsSending(false);
    }
  };

  // Filter logs
  const filteredLogs = smsLogs.filter((log) => {
    if (logStatusFilter !== 'ALL' && log.status !== logStatusFilter) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const matchMobile = log.recipientMobile.toLowerCase().includes(q);
      const matchRecipient = (log.recipientName || '').toLowerCase().includes(q);
      const matchMsg = (log.messageBody || log.messageContent || '').toLowerCase().includes(q);
      const matchTemplate = (log.templateName || log.templateType || '').toLowerCase().includes(q);
      if (!matchMobile && !matchRecipient && !matchMsg && !matchTemplate) return false;
    }
    return true;
  });

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

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171226] border border-[#302741] p-4 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              <Smartphone className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              SMS Service Centre & Gateway Broadcasts
            </h2>
          </div>
          <p className="text-xs text-[#C9C4D6] mt-1">
            Automated transactional event triggers, bulk notification campaigns, real-time gateway balance and delivery telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#100D1B] border border-[#302741] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="text-xs font-bold text-white">Steadfast Gateway: </span>
            <span className="text-xs font-mono text-[#22D3EE] font-bold">ACTIVE</span>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Submodule Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#302741] pb-2 overflow-x-auto">
        {[
          { id: 'DASHBOARD', label: 'SMS Dashboard', icon: Zap },
          { id: 'TRIGGERS', label: 'Automated Triggers', icon: Radio },
          { id: 'BULK', label: 'Bulk Broadcast', icon: Send },
          { id: 'LOGS', label: 'SMS Delivery Logs', icon: Clock },
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

      {/* TAB 1: SMS DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#34D399]">
                Available SMS Balance
              </span>
              <p className="text-2xl font-extrabold text-white tabular-nums">
                {smsMetrics?.smsBalance.toLocaleString() || '14,250'} SMS
              </p>
              <p className="text-[11px] text-[#C9C4D6]/70">Steadfast Bulk Provider Pool</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                Dispatched Today
              </span>
              <p className="text-2xl font-extrabold text-white tabular-nums">
                {smsMetrics?.todaySent.toLocaleString() || '412'} SMS
              </p>
              <p className="text-[11px] text-[#C9C4D6]/70">Transactional & Broadcasts</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7]">
                Total Lifetime Dispatched
              </span>
              <p className="text-2xl font-extrabold text-white tabular-nums">
                {smsMetrics?.totalSent.toLocaleString() || '38,920'} SMS
              </p>
              <p className="text-[11px] text-[#C9C4D6]/70">Across all DropNest modules</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FBBF24]">
                Delivery Success Rate
              </span>
              <p className="text-2xl font-extrabold text-white tabular-nums">
                {smsMetrics?.deliverySuccessRate || 99.2}%
              </p>
              <p className="text-[11px] text-[#34D399]">High Gateway Quality SLA</p>
            </div>
          </div>

          {/* Quick Triggers Glance & Gateway Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#A855F7]" />
                  <span>Automated System Triggers</span>
                </h3>
                <button
                  onClick={() => setActiveTab('TRIGGERS')}
                  className="text-xs text-[#22D3EE] hover:underline"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'ORDER_CONFIRMATION', label: 'Order Confirmation', desc: 'Sent when order is confirmed by seller/admin' },
                  { key: 'ORDER_SHIPPED', label: 'Order Shipped', desc: 'Sent when courier picks up parcel' },
                  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Sent on rider dispatch day' },
                  { key: 'ORDER_DELIVERED', label: 'Order Delivered', desc: 'Sent on successful cash collection' },
                  { key: 'DELIVERY_FAILED', label: 'Delivery Failed', desc: 'Sent on courier return or cancellation' },
                ].map((item) => {
                  const isEnabled = smsMetrics?.automatedTriggers?.[item.key] ?? true;
                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{item.label}</p>
                        <p className="text-[10px] text-[#C9C4D6]/70">{item.desc}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isEnabled
                            ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
                            : 'bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30'
                        }`}
                      >
                        {isEnabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gateway Status Box */}
            <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#22D3EE]" />
                <span>Bangladesh Telecom Gateway Telemetry</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#100D1B] border border-[#302741] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9C4D6]">Primary Gateway:</span>
                    <span className="font-bold text-white">Steadfast SMS Gateway BD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9C4D6]">API Status:</span>
                    <span className="font-semibold text-[#34D399]">Connected (Latency 142ms)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9C4D6]">Sender ID / Masking:</span>
                    <span className="font-mono text-[#A855F7]">DropNestBD (BTRC Approved)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9C4D6]">Route Priority:</span>
                    <span className="text-white">Tier-1 Direct Telecom Route</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#C9C4D6] space-y-1">
                  <p className="font-bold text-white text-xs">Bangla Unicode Support Notice</p>
                  <p className="text-[11px] leading-relaxed">
                    DropNest automatically detects Bangla Unicode characters. Standard English SMS allows 160 characters per part, while Bangla Unicode allows 70 characters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED TRIGGERS */}
      {activeTab === 'TRIGGERS' && (
        <div className="p-5 rounded-2xl bg-[#171226] border border-[#302741] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Automated SMS Event Configuration</h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">
              Enable or disable automatic SMS dispatches triggered by operational events.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                key: 'ORDER_CONFIRMATION',
                label: 'Order Confirmation SMS',
                desc: 'Dispatched to customer when an order is verified and confirmed by reseller/admin.',
                sample: 'Dear {Customer}, Your DropNest order #{Invoice} is confirmed. Total: {Amount} BDT. Helpline: 01893-665896',
              },
              {
                key: 'ORDER_SHIPPED',
                label: 'Order Shipped / Courier Picked',
                desc: 'Dispatched when courier rider scans consignment into the transit hub.',
                sample: 'Dear {Customer}, Your parcel #{Invoice} has been handed over to {Courier}. Tracking: {TrackID}.',
              },
              {
                key: 'OUT_FOR_DELIVERY',
                label: 'Out for Delivery',
                desc: 'Dispatched in the morning of scheduled customer delivery.',
                sample: 'Dear {Customer}, Your DropNest order #{Invoice} is out for delivery today via {Courier}. Please keep {Amount} BDT ready.',
              },
              {
                key: 'ORDER_DELIVERED',
                label: 'Order Delivered Successfully',
                desc: 'Dispatched upon successful doorstep handover and cash collection.',
                sample: 'Dear {Customer}, Your order #{Invoice} was successfully delivered. Thank you for choosing DropNest!',
              },
              {
                key: 'DELIVERY_FAILED',
                label: 'Delivery Failed / Return Initiated',
                desc: 'Dispatched when customer was unreachable or parcel returned.',
                sample: 'Dear {Customer}, Courier was unable to complete delivery for #{Invoice}. Please contact DropNest support.',
              },
            ].map((trigger) => {
              const isEnabled = smsMetrics?.automatedTriggers?.[trigger.key] ?? true;
              return (
                <div
                  key={trigger.key}
                  className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{trigger.label}</span>
                      <span
                        className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                          isEnabled ? 'bg-[#34D399]/20 text-[#34D399]' : 'bg-[#F87171]/20 text-[#F87171]'
                        }`}
                      >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#C9C4D6]">{trigger.desc}</p>
                    <p className="text-[10px] font-mono text-[#A855F7] bg-[#171226] p-1.5 rounded border border-[#302741]">
                      Template: {trigger.sample}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleTrigger(trigger.key, isEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                      isEnabled
                        ? 'bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40'
                        : 'bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#34D399] border border-[#34D399]/40'
                    }`}
                  >
                    {isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{isEnabled ? 'Deactivate Trigger' : 'Activate Trigger'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BULK BROADCAST */}
      {activeTab === 'BULK' && (
        <div className="p-6 rounded-2xl bg-[#171226] border border-[#302741] space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">Bulk SMS Campaign Dispatcher</h3>
            <p className="text-xs text-[#C9C4D6] mt-0.5">
              Send mass notices, marketing promotions, or operational advisories across resellers, suppliers or specific districts.
            </p>
          </div>

          <form onSubmit={handleSendBulk} className="space-y-4">
            {/* Target Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#C9C4D6] mb-2">
                Select Recipient Group *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ALL_RESELLERS', label: 'All Resellers', count: '148 sellers' },
                  { id: 'ALL_SUPPLIERS', label: 'All Suppliers', count: '32 merchants' },
                  { id: 'DISTRICT', label: 'Specific District', count: 'Geo filter' },
                  { id: 'CUSTOM', label: 'Custom Numbers', count: 'Direct paste' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setTargetGroup(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetGroup === item.id
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                        : 'bg-[#100D1B] border-[#302741] text-[#C9C4D6] hover:border-[#7C3AED]/50'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-[#22D3EE] mt-0.5">{item.count}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* If District selected */}
            {targetGroup === 'DISTRICT' && (
              <div>
                <label className="block text-xs font-semibold text-[#C9C4D6] mb-1">
                  Target Bangladesh District *
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.division} Division)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If Custom selected */}
            {targetGroup === 'CUSTOM' && (
              <div>
                <label className="block text-xs font-semibold text-[#C9C4D6] mb-1">
                  Enter Mobile Numbers (Comma, space or new line separated) *
                </label>
                <textarea
                  value={customNumbersInput}
                  onChange={(e) => setCustomNumbersInput(e.target.value)}
                  placeholder="01711000000, 01893665896, 01911223344"
                  rows={3}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#7C3AED] font-mono"
                />
              </div>
            )}

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#C9C4D6]">
                  Message Body (English or বাংলা Unicode) *
                </label>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    isBanglaOrUnicode
                      ? 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30'
                      : 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                  }`}>
                    {isBanglaOrUnicode ? 'বাংলা / Unicode' : 'Standard English'}
                  </span>
                  <span className="text-white font-semibold">
                    {charCount} chars · {smsParts} Part(s)
                  </span>
                </div>
              </div>

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here... ড্রপনেস্ট প্ল্যাটফর্মের পক্ষ থেকে সম্মানিত রিসেলার ও সাপ্লায়ারদের শুভেচ্ছা..."
                rows={4}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#7C3AED]"
              />

              <div className="mt-1 flex items-center justify-between text-[10px] text-[#C9C4D6]/70">
                <span>Part Limit: {maxPerPart} characters per SMS part.</span>
                <span>Estimated Cost per recipient: {formatBDT(smsParts * 0.35)}</span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSending || !messageText.trim()}
                className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"
              >
                {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Dispatch Broadcast</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SMS DELIVERY LOGS */}
      {activeTab === 'LOGS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#C9C4D6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search SMS logs by recipient, mobile number or message content..."
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="sm:w-44">
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value as any)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#100D1B] border-b border-[#302741] text-[#C9C4D6] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Recipient / Mobile</th>
                    <th className="py-3 px-4">Template / Purpose</th>
                    <th className="py-3 px-4">Message Content</th>
                    <th className="py-3 px-4">Gateway & Cost</th>
                    <th className="py-3 px-4">Status & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#C9C4D6]">
                        No SMS logs found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#1C1630] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{log.recipientName || 'Recipient'}</span>
                          <span className="font-mono text-[11px] text-[#22D3EE] block mt-0.5">
                            {log.recipientMobile}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#A855F7] block">
                            {log.templateName || log.templateType || 'SMS Notification'}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-white text-[11px] line-clamp-2 leading-relaxed">
                            {log.messageBody || log.messageContent}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-white block">{log.gatewayUsed || log.provider || 'Steadfast Gateway'}</span>
                          <span className="text-[10px] text-[#34D399] font-mono block mt-0.5">
                            {formatBDT(log.costBDT ?? log.cost ?? 0.35)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              log.status === 'DELIVERED'
                                ? 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/30'
                                : log.status === 'PENDING'
                                ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30'
                                : 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-[10px] text-[#C9C4D6]/70 block mt-1">
                            {formatBangladeshDateTime(log.sentAt || log.timestamp || new Date().toISOString())}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
