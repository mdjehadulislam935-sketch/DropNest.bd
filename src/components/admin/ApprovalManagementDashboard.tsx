import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileCheck,
  Globe,
  History,
  Mail,
  MapPin,
  Maximize2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  PhoneCall,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserMinus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { ApiService } from '../../services/api.ts';
import { formatBangladeshDateTime } from '../../utils/formatters.ts';
import type { ContactHistoryEntry, UserVerificationItem } from '../../types/admin.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface ApprovalManagementDashboardProps {
  onNavigateToFullQueue?: (submodule?: string) => void;
  maxDisplay?: number;
  showFilters?: boolean;
}

export const ApprovalManagementDashboard: React.FC<ApprovalManagementDashboardProps> = ({
  onNavigateToFullQueue,
  maxDisplay = 6,
  showFilters = true,
}) => {
  const [requests, setRequests] = useState<UserVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'RESELLER' | 'SUPPLIER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Slide-over Drawer States for 'Expand Details'
  const [slideOverItem, setSlideOverItem] = useState<UserVerificationItem | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<'PROFILE' | 'DOCS' | 'CONTACTS' | 'AUDIT'>('PROFILE');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactType, setContactType] = useState<
    'PHONE_CALL' | 'SMS_SENT' | 'EMAIL_DISPATCH' | 'WHATSAPP' | 'IN_PERSON_VISIT'
  >('PHONE_CALL');
  const [contactOutcome, setContactOutcome] = useState<
    'REACHED_VERIFIED' | 'CALL_BUSY' | 'UNREACHABLE' | 'FOLLOWUP_SCHEDULED' | 'EMAIL_DELIVERED' | 'DOCUMENT_REQUESTED'
  >('REACHED_VERIFIED');
  const [contactNotes, setContactNotes] = useState('');
  const [contactDuration, setContactDuration] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Full Document Image Lightbox
  const [docModalUrl, setDocModalUrl] = useState<{ name: string; url: string } | null>(null);

  // Modal / Action States with Audit Logging Placeholders
  const [approvingItem, setApprovingItem] = useState<UserVerificationItem | null>(null);
  const [approvalAuditNote, setApprovalAuditNote] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const [rejectingItem, setRejectingItem] = useState<UserVerificationItem | null>(null);
  const [rejectionAuditReason, setRejectionAuditReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getUserVerifications();
      setRequests(data);
      // Keep slideOverItem in sync if open
      if (slideOverItem) {
        const updated = data.find((d) => d.id === slideOverItem.id);
        if (updated) setSlideOverItem(updated);
      }
    } catch (err: any) {
      console.error('Failed to load pending registrations:', err);
      setFeedback({ text: 'Unable to sync registration requests from backend.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests
  const pendingRequests = requests.filter(
    (item) => item.status === 'PENDING' || item.status === 'UNDER_REVIEW'
  );

  const filteredRequests = pendingRequests.filter((item) => {
    if (roleFilter !== 'ALL' && item.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.fullName.toLowerCase().includes(q);
      const matchEmail = item.email.toLowerCase().includes(q);
      const matchMobile = item.mobile.includes(q);
      const matchBiz = item.businessName?.toLowerCase().includes(q);
      const matchDistrict = item.district.toLowerCase().includes(q);
      const matchRole = item.role.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchMobile && !matchBiz && !matchDistrict && !matchRole) {
        return false;
      }
    }
    return true;
  });

  const displayedList = filteredRequests.slice(0, maxDisplay);

  const totalPending = pendingRequests.length;
  const resellerCount = pendingRequests.filter((r) => r.role === 'RESELLER').length;
  const supplierCount = pendingRequests.filter((r) => r.role === 'SUPPLIER').length;

  const handleApprove = async () => {
    if (!approvingItem) return;
    setIsSubmittingApproval(true);
    try {
      const auditNote = approvalAuditNote.trim() || 'Approved after KYC credentials and identity validation';
      const res = await ApiService.reviewUserVerification(approvingItem.id, 'APPROVED', auditNote);
      setFeedback({
        text: `[AUDIT RECORDED] ${approvingItem.fullName} (${approvingItem.role}) approved and credentials activated.`,
      });
      if (slideOverItem && slideOverItem.id === approvingItem.id) {
        setSlideOverItem(res.item);
      }
      setApprovingItem(null);
      setApprovalAuditNote('');
      fetchRequests();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Approval action failed.', isError: true });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionAuditReason || rejectionAuditReason.trim().length < 5) {
      setFeedback({
        text: 'A mandatory audit rejection reason is required (minimum 5 characters).',
        isError: true,
      });
      return;
    }
    setIsSubmittingRejection(true);
    try {
      const auditReason = rejectionAuditReason.trim();
      const res = await ApiService.reviewUserVerification(rejectingItem.id, 'REJECTED', auditReason);
      setFeedback({
        text: `[AUDIT RECORDED] Application #${rejectingItem.id} rejected. Reason logged to compliance audit trail.`,
      });
      if (slideOverItem && slideOverItem.id === rejectingItem.id) {
        setSlideOverItem(res.item);
      }
      setRejectingItem(null);
      setRejectionAuditReason('');
      fetchRequests();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Rejection action failed.', isError: true });
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const handleAddContactLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideOverItem) return;
    if (!contactNotes.trim()) {
      setFeedback({ text: 'Please enter notes describing this contact interaction.', isError: true });
      return;
    }

    setIsSubmittingContact(true);
    try {
      const res = await ApiService.addVerificationContactLog(slideOverItem.id, {
        type: contactType,
        outcome: contactOutcome,
        notes: contactNotes.trim(),
        duration: contactDuration.trim() || undefined,
      });

      setSlideOverItem(res.item);
      setRequests((prev) => prev.map((item) => (item.id === res.item.id ? res.item : item)));
      setIsAddingContact(false);
      setContactNotes('');
      setContactDuration('');
      setFeedback({ text: `Logged new contact verification note for ${res.item.fullName}.` });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to record contact interaction.', isError: true });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setFeedback({ text: `${label} copied to clipboard.` });
  };


  return (
    <div className="bg-[#171226] border border-[#302741] rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedback.isError
              ? 'bg-[#F87171]/10 border-[#F87171]/40 text-[#F87171]'
              : 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertOctagon className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#302741] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Approval Management</h3>
            {totalPending > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EC4899] text-white">
                {totalPending} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-[#C9C4D6] mt-1">
            Review pending registration requests from Resellers and Suppliers with status badges, audit logging, and slide-over profile inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-[#C9C4D6] hover:text-white transition-colors"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onNavigateToFullQueue && (
            <button
              onClick={() => onNavigateToFullQueue('Pending Requests')}
              className="px-3 py-1.5 rounded-xl bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/40 text-xs font-bold text-[#A855F7] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Full Queue</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {showFilters && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#100D1B] p-2.5 rounded-xl border border-[#302741]">
          {/* Role Filters */}
          <div className="flex items-center gap-1 w-full md:w-auto">
            {[
              { id: 'ALL', label: `All Pending (${totalPending})` },
              { id: 'RESELLER', label: `Resellers (${resellerCount})` },
              { id: 'SUPPLIER', label: `Suppliers (${supplierCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-[#C9C4D6] hover:text-white hover:bg-[#1E1733]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#C9C4D6]" />
            <input
              type="text"
              placeholder="Search name, email, mobile, district, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-[#171226] border border-[#302741] rounded-lg text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-[#C9C4D6] hover:text-white"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#C9C4D6] space-y-2">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#7C3AED]" />
            <p>Loading registration requests...</p>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#C9C4D6] bg-[#100D1B] rounded-xl border border-[#302741]">
            <CheckCircle2 className="w-8 h-8 mx-auto text-[#34D399]/40 mb-2" />
            <p className="font-semibold text-white">No pending registration requests found.</p>
            <p className="text-[11px] text-[#C9C4D6]/70 mt-0.5">
              All submitted reseller and supplier applications have been reviewed.
            </p>
          </div>
        ) : (
          displayedList.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-[#100D1B] hover:bg-[#1E1733]/60 border border-[#302741] hover:border-[#7C3AED]/40 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              {/* Applicant Info */}
              <div
                className="space-y-1.5 min-w-0 flex-1 cursor-pointer"
                onClick={() => {
                  setSlideOverItem(item);
                  setSlideOverTab('PROFILE');
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#A855F7]">{item.id}</span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.role === 'RESELLER'
                        ? 'bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30'
                        : item.role === 'SUPPLIER'
                        ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                        : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                    }`}
                  >
                    {item.role === 'RESELLER' ? (
                      <Smartphone className="w-2.5 h-2.5" />
                    ) : (
                      <Building2 className="w-2.5 h-2.5" />
                    )}
                    <span>{item.role}</span>
                  </span>

                  {/* Status Badge */}
                  <StatusBadge status={item.status} size="xs" showIcon={true} />

                  <span className="text-[10px] text-[#C9C4D6]/70 font-mono">
                    {formatBangladeshDateTime(item.registrationDate)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 text-xs">
                  <span className="font-bold text-white group-hover:text-[#A855F7] transition-colors truncate">
                    {item.fullName}
                  </span>
                  <span className="text-[#C9C4D6] flex items-center gap-1 truncate text-[11px]">
                    <Building2 className="w-3 h-3 text-[#22D3EE] shrink-0" />
                    <span>{item.businessName || 'Independent Seller'}</span>
                  </span>
                  <span className="text-[#22D3EE] font-mono text-[11px] flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{item.mobile}</span>
                  </span>
                </div>

                <div className="text-[11px] text-[#C9C4D6]/80 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Email: <strong className="text-white font-mono">{item.email}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Region: <strong className="text-white">{item.upazila}, {item.district}</strong>
                  </span>
                  {item.tradeLicense && (
                    <>
                      <span>·</span>
                      <span>
                        TL: <strong className="text-white font-mono">{item.tradeLicense}</strong>
                      </span>
                    </>
                  )}
                  {item.verificationDocs && (
                    <>
                      <span>·</span>
                      <span className="text-[#34D399] font-medium flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        <span>{item.verificationDocs.length} Document(s)</span>
                      </span>
                    </>
                  )}
                  {item.contactHistory && item.contactHistory.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-[#A855F7] font-medium flex items-center gap-1">
                        <PhoneCall className="w-2.5 h-2.5" />
                        <span>{item.contactHistory.length} Contact Note(s)</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons with Audit Logging & Expand Details */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#302741]">
                {/* Expand Details Button */}
                <button
                  onClick={() => {
                    setSlideOverItem(item);
                    setSlideOverTab('PROFILE');
                  }}
                  className="px-2.5 py-1.5 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/35 border border-[#7C3AED]/50 text-[#A855F7] hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Expand Details: Profile, Contact History & Documents"
                >
                  <PanelRightOpen className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Expand Details</span>
                </button>

                {/* Approve Button */}
                <button
                  onClick={() => {
                    setApprovingItem(item);
                    setApprovalAuditNote('Approved after trade license & identity verification.');
                  }}
                  className="px-3 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Approve & Log Audit Clearance"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>

                {/* Reject Button */}
                <button
                  onClick={() => {
                    setRejectingItem(item);
                    setRejectionAuditReason('');
                  }}
                  className="px-2.5 py-1.5 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reject with Audit Rationale"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Audit Logging Footnote */}
      <div className="bg-[#100D1B] p-3 rounded-xl border border-[#302741] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#C9C4D6]">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Audit Logging Active: Every approval & rejection is recorded into the compliance audit ledger.</span>
        </div>
        {onNavigateToFullQueue && (
          <button
            onClick={() => onNavigateToFullQueue('Approval Audit Trail')}
            className="text-[#A855F7] hover:underline flex items-center gap-1 font-semibold"
          >
            <History className="w-3 h-3" />
            <span>View Decision Audit Trail</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER: EXPAND DETAILS VIEW                                    */}
      {/* ========================================================================= */}
      {slideOverItem && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => {
              setSlideOverItem(null);
              setIsAddingContact(false);
            }}
          />

          {/* Slide-over Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-2xl sm:max-w-3xl bg-[#130E22] border-l border-[#302741] shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-[#302741] bg-[#171226]/90 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
                      {slideOverItem.id}
                    </span>
                    <StatusBadge status={slideOverItem.status} size="sm" showIcon={true} />

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        slideOverItem.role === 'RESELLER'
                          ? 'bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30'
                          : slideOverItem.role === 'SUPPLIER'
                          ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                      }`}
                    >
                      {slideOverItem.role === 'RESELLER' ? (
                        <Smartphone className="w-2.5 h-2.5" />
                      ) : (
                        <Building2 className="w-2.5 h-2.5" />
                      )}
                      <span>{slideOverItem.role}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {slideOverItem.status !== 'APPROVED' && (
                      <button
                        onClick={() => {
                          setApprovingItem(slideOverItem);
                          setApprovalAuditNote('Approved after credentials and identity inspection.');
                        }}
                        className="px-3 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Approve Application"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Approve</span>
                      </button>
                    )}

                    {slideOverItem.status !== 'REJECTED' && (
                      <button
                        onClick={() => {
                          setRejectingItem(slideOverItem);
                          setRejectionAuditReason('');
                        }}
                        className="px-3 py-1.5 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Reject Application"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSlideOverItem(null);
                        setIsAddingContact(false);
                      }}
                      className="p-1.5 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741] transition-colors cursor-pointer"
                      title="Close Slide-over"
                    >
                      <PanelRightClose className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Profile Identity Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-lg font-bold text-[#A855F7] shrink-0">
                      {slideOverItem.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-tight">
                        {slideOverItem.fullName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#C9C4D6] mt-0.5">
                        <span className="flex items-center gap-1 text-[#22D3EE] font-medium">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{slideOverItem.businessName || 'Independent Retailer'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#C9C4D6]/70" />
                          <span>{slideOverItem.upazila}, {slideOverItem.district}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#C9C4D6]/70 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>Reg: {formatBangladeshDateTime(slideOverItem.registrationDate)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-[#302741] pt-1 -mb-1">
                  {[
                    { id: 'PROFILE', label: 'User Profile & Entity', icon: UserCheck },
                    {
                      id: 'DOCS',
                      label: `Verification Documents (${slideOverItem.verificationDocs?.length || 0})`,
                      icon: FileCheck,
                    },
                    {
                      id: 'CONTACTS',
                      label: `Contact History (${slideOverItem.contactHistory?.length || 0})`,
                      icon: PhoneCall,
                    },
                    {
                      id: 'AUDIT',
                      label: `Audit Trail (${slideOverItem.auditTrail?.length || 0})`,
                      icon: History,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = slideOverTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSlideOverTab(tab.id as any);
                          setIsAddingContact(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                          isActive
                            ? 'border-[#7C3AED] text-white bg-[#7C3AED]/10 rounded-t-lg'
                            : 'border-transparent text-[#C9C4D6] hover:text-white hover:bg-[#1E1733]/50 rounded-t-lg'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#A855F7]' : 'text-[#C9C4D6]'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Body Content Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* TAB 1: DEEP USER PROFILE INFORMATION */}
                {slideOverTab === 'PROFILE' && (
                  <div className="space-y-5">
                    {/* Communication Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#C9C4D6] block">Direct Mobile / Phone</span>
                          <span className="font-mono text-sm font-bold text-[#22D3EE]">
                            {slideOverItem.mobile}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyToClipboard(slideOverItem.mobile, 'Mobile Number')}
                            className="p-1.5 rounded-lg bg-[#100D1B] hover:bg-[#251E3A] text-[#C9C4D6] hover:text-white border border-[#302741]"
                            title="Copy number"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${slideOverItem.mobile}`}
                            className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] text-xs font-semibold border border-[#22D3EE]/40 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="text-[10px] text-[#C9C4D6] block">Verified Email Address</span>
                          <span className="font-mono text-xs font-semibold text-white truncate block">
                            {slideOverItem.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyToClipboard(slideOverItem.email, 'Email Address')}
                            className="p-1.5 rounded-lg bg-[#100D1B] hover:bg-[#251E3A] text-[#C9C4D6] hover:text-white border border-[#302741]"
                            title="Copy email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`mailto:${slideOverItem.email}`}
                            className="px-2.5 py-1 rounded-lg bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#A855F7] text-xs font-semibold border border-[#7C3AED]/40 flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Government & Compliance IDs */}
                    <div className="p-4 bg-[#171226] border border-[#302741] rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[#A855F7]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                        <span>Government & Business Verification Credentials</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 bg-[#100D1B] rounded-lg border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] block">National ID (NID)</span>
                          <span className="font-mono font-bold text-white">
                            {slideOverItem.nidNumber || 'Not Submitted'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#100D1B] rounded-lg border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] block">Trade License (City Corp/Union)</span>
                          <span className="font-mono font-bold text-[#34D399]">
                            {slideOverItem.tradeLicense || 'Not Applicable'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[#100D1B] rounded-lg border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] block">Tax Identification (TIN)</span>
                          <span className="font-mono font-bold text-[#22D3EE]">
                            {slideOverItem.tin || 'Exempt / Not Provided'}
                          </span>
                        </div>
                      </div>

                      {slideOverItem.productCategory && (
                        <div className="p-2.5 bg-[#100D1B] rounded-lg border border-[#302741] text-xs flex items-center justify-between">
                          <span className="text-[#C9C4D6]">Wholesale / Catalog Category:</span>
                          <span className="font-semibold text-white">{slideOverItem.productCategory}</span>
                        </div>
                      )}
                    </div>

                    {/* Address & Geographical Foothold */}
                    <div className="p-4 bg-[#171226] border border-[#302741] rounded-xl space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[#22D3EE]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Registered Physical Operating Address</span>
                      </h4>
                      <div className="p-3 bg-[#100D1B] rounded-lg border border-[#302741] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#C9C4D6]">District & Upazila:</span>
                          <span className="font-medium text-white">{slideOverItem.upazila}, {slideOverItem.district}</span>
                        </div>
                        {slideOverItem.address && (
                          <div className="flex justify-between">
                            <span className="text-[#C9C4D6]">Street / Holding Details:</span>
                            <span className="font-medium text-white text-right max-w-xs">{slideOverItem.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bank & MFS Payout Channel */}
                    {slideOverItem.bankDetails && (
                      <div className="p-4 bg-[#171226] border border-[#302741] rounded-xl space-y-2 text-xs">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-[#34D399]">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bank & Financial Settlement Account</span>
                        </h4>
                        <div className="p-3 bg-[#100D1B] rounded-lg border border-[#302741] grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-[#C9C4D6] block">Institution / Bank</span>
                            <span className="font-bold text-white">{slideOverItem.bankDetails.bankName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#C9C4D6] block">Account Title</span>
                            <span className="font-semibold text-white">{slideOverItem.bankDetails.accountName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#C9C4D6] block">Account Number</span>
                            <span className="font-mono text-[#34D399] font-bold">{slideOverItem.bankDetails.accountNumber}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#C9C4D6] block">Branch / Routing</span>
                            <span className="font-mono text-[#C9C4D6]">{slideOverItem.bankDetails.routingNumber || slideOverItem.bankDetails.branchName}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* System & Telemetry Context */}
                    <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C9C4D6]">
                      <span>Registration IP: <strong className="font-mono text-white">{slideOverItem.ipAddress || '103.112.54.18'}</strong></span>
                      <span>Device: <strong className="text-white">{slideOverItem.deviceInfo || 'Chrome 122 on Windows 11'}</strong></span>
                      <span>Source: <strong className="text-[#A855F7]">DropNest Web Portal</strong></span>
                    </div>
                  </div>
                )}

                {/* TAB 2: VERIFICATION DOCUMENTS */}
                {slideOverTab === 'DOCS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Attached KYC & Entity Credentials</h4>
                        <p className="text-xs text-[#C9C4D6]">
                          Review applicant submitted documentation scans before granting clearance.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-[#100D1B] border border-[#302741] text-xs font-mono text-[#34D399] rounded-lg">
                        {slideOverItem.verificationDocs?.length || 0} Files
                      </span>
                    </div>

                    {(!slideOverItem.verificationDocs || slideOverItem.verificationDocs.length === 0) ? (
                      <div className="p-8 text-center text-xs text-[#C9C4D6] bg-[#171226] border border-[#302741] rounded-xl">
                        No documents attached to this registration application.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {slideOverItem.verificationDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="bg-[#171226] border border-[#302741] hover:border-[#7C3AED]/40 rounded-xl p-3.5 space-y-3 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate max-w-[180px]">{doc.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30 uppercase">
                                {doc.type}
                              </span>
                            </div>

                            <div
                              onClick={() => setDocModalUrl(doc)}
                              className="h-28 bg-[#100D1B] border border-[#302741] rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group relative"
                            >
                              <img
                                src={doc.url}
                                alt={doc.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-bold">
                                <Maximize2 className="w-4 h-4" />
                                <span>Preview Scan</span>
                              </div>
                            </div>

                            <button
                              onClick={() => setDocModalUrl(doc)}
                              className="w-full py-1.5 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-[#22D3EE] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Document High-Res</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CONTACT HISTORY & ATTEMPTS */}
                {slideOverTab === 'CONTACTS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#302741] pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Applicant Contact History</h4>
                        <p className="text-xs text-[#C9C4D6]">
                          Track administrative outreach, phone call verifications, and WhatsApp dispatches.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsAddingContact((prev) => !prev)}
                        className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isAddingContact ? 'Cancel Log' : 'Log Outreach'}</span>
                      </button>
                    </div>

                    {/* Inline Contact Log Form */}
                    {isAddingContact && (
                      <form
                        onSubmit={handleAddContactLog}
                        className="p-4 bg-[#171226] border border-[#7C3AED]/40 rounded-xl space-y-3 animate-in fade-in"
                      >
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-[#A855F7]" />
                          <span>Record New Contact Attempt / Call Note</span>
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] text-[#C9C4D6] mb-1">Contact Channel</label>
                            <select
                              value={contactType}
                              onChange={(e) => setContactType(e.target.value as any)}
                              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2 text-white focus:outline-none focus:border-[#7C3AED]"
                            >
                              <option value="PHONE_CALL">Phone Call</option>
                              <option value="WHATSAPP">WhatsApp</option>
                              <option value="SMS_SENT">SMS Alert</option>
                              <option value="EMAIL_DISPATCH">Email Outreach</option>
                              <option value="IN_PERSON_VISIT">Field Audit</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-[#C9C4D6] mb-1">Call / Outreach Outcome</label>
                            <select
                              value={contactOutcome}
                              onChange={(e) => setContactOutcome(e.target.value as any)}
                              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2 text-white focus:outline-none focus:border-[#7C3AED]"
                            >
                              <option value="REACHED_VERIFIED">Reached & Identity Verified</option>
                              <option value="CALL_BUSY">Line Busy</option>
                              <option value="UNREACHABLE">Unreachable / Switched Off</option>
                              <option value="FOLLOWUP_SCHEDULED">Follow-up Scheduled</option>
                              <option value="DOCUMENT_REQUESTED">Additional Docs Requested</option>
                              <option value="EMAIL_DELIVERED">Email Delivered</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-[#C9C4D6] mb-1">Call Duration (opt)</label>
                            <input
                              type="text"
                              value={contactDuration}
                              onChange={(e) => setContactDuration(e.target.value)}
                              placeholder="e.g. 3m 45s"
                              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2 text-white focus:outline-none focus:border-[#7C3AED]"
                            >
                            </input>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-[#C9C4D6] mb-1">Admin Interaction Notes *</label>
                          <textarea
                            value={contactNotes}
                            onChange={(e) => setContactNotes(e.target.value)}
                            rows={2}
                            placeholder="Describe conversation details, verified shop address, warehouse availability, etc."
                            className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingContact(false)}
                            className="px-3 py-1.5 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-white rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingContact}
                            className="px-3 py-1.5 bg-[#34D399] hover:bg-[#10B981] disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            {isSubmittingContact ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Save Contact Record</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Timeline */}
                    <div className="space-y-3">
                      {(!slideOverItem.contactHistory || slideOverItem.contactHistory.length === 0) ? (
                        <div className="p-8 text-center text-xs text-[#C9C4D6] bg-[#171226] border border-[#302741] rounded-xl">
                          No direct administrative contacts recorded yet for this application.
                        </div>
                      ) : (
                        slideOverItem.contactHistory.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white flex items-center gap-1.5">
                                  {item.type === 'PHONE_CALL' ? (
                                    <PhoneCall className="w-3.5 h-3.5 text-[#34D399]" />
                                  ) : item.type === 'WHATSAPP' ? (
                                    <MessageSquare className="w-3.5 h-3.5 text-[#22D3EE]" />
                                  ) : item.type === 'SMS_SENT' ? (
                                    <Smartphone className="w-3.5 h-3.5 text-[#EC4899]" />
                                  ) : (
                                    <Mail className="w-3.5 h-3.5 text-[#A855F7]" />
                                  )}
                                  <span>{item.type.replace('_', ' ')}</span>
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.outcome === 'REACHED_VERIFIED'
                                      ? 'bg-[#34D399]/20 text-[#34D399]'
                                      : item.outcome === 'CALL_BUSY' || item.outcome === 'UNREACHABLE'
                                      ? 'bg-[#F87171]/20 text-[#F87171]'
                                      : 'bg-[#22D3EE]/20 text-[#22D3EE]'
                                  }`}
                                >
                                  {item.outcome.replace('_', ' ')}
                                </span>
                              </div>

                              <span className="text-[10px] text-[#C9C4D6]/70 font-mono">
                                {formatBangladeshDateTime(item.timestamp)}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#C9C4D6] bg-[#100D1B] p-2 rounded-lg border border-[#302741]">
                              {item.notes}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-[#C9C4D6]/70">
                              <span>Admin Actor: <strong className="text-white">{item.adminName}</strong></span>
                              {item.duration && <span>Duration: <strong className="font-mono text-white">{item.duration}</strong></span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: AUDIT TRAIL */}
                {slideOverTab === 'AUDIT' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Application Audit Trail</h4>
                      <p className="text-xs text-[#C9C4D6]">
                        Immutable compliance record tracking all actions, reviews, and status changes.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(!slideOverItem.auditTrail || slideOverItem.auditTrail.length === 0) ? (
                        <div className="p-8 text-center text-xs text-[#C9C4D6] bg-[#171226] border border-[#302741] rounded-xl">
                          Initial submission recorded on {formatBangladeshDateTime(slideOverItem.registrationDate)}.
                        </div>
                      ) : (
                        slideOverItem.auditTrail.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3.5 bg-[#171226] border border-[#302741] rounded-xl space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {entry.previousStatus && entry.previousStatus !== (entry.newStatus || entry.action) && (
                                  <span className="text-[10px] text-[#C9C4D6] font-mono flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-[#100D1B] border border-[#302741] text-[#C9C4D6]">
                                      {entry.previousStatus}
                                    </span>
                                    <span>→</span>
                                  </span>
                                )}
                                <StatusBadge status={entry.newStatus || entry.action} size="xs" showIcon={true} />
                              </div>
                              <span className="text-[10px] text-[#C9C4D6]/70 font-mono">
                                {formatBangladeshDateTime(entry.timestamp)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-white font-medium text-xs">
                              <span>Actor: <strong className="text-[#A855F7]">{entry.actorName}</strong></span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30 font-mono">
                                Role: {entry.actorRole}
                              </span>
                            </div>

                            {entry.notes && (
                              <p className="text-[11px] text-[#C9C4D6] bg-[#100D1B] p-2 rounded-lg border border-[#302741]">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Slide-over Footer Actions */}
              <div className="p-4 border-t border-[#302741] bg-[#171226] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#C9C4D6]">
                  <span>Status:</span>
                  <StatusBadge status={slideOverItem.status} size="xs" showIcon={false} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSlideOverItem(null);
                      setIsAddingContact(false);
                    }}
                    className="px-4 py-2 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Close Panel
                  </button>

                  {slideOverItem.status !== 'APPROVED' && (
                    <button
                      onClick={() => {
                        setApprovingItem(slideOverItem);
                        setApprovalAuditNote('Approved after credentials and identity inspection.');
                      }}
                      className="px-4 py-2 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Registration</span>
                    </button>
                  )}

                  {slideOverItem.status !== 'REJECTED' && (
                    <button
                      onClick={() => {
                        setRejectingItem(slideOverItem);
                        setRejectionAuditReason('');
                      }}
                      className="px-3.5 py-2 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVE ACTION MODAL WITH AUDIT NOTE PLACEHOLDER                          */}
      {/* ========================================================================= */}
      {approvingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#171226] border border-[#34D399]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#302741] pb-3">
              <div className="p-2 rounded-xl bg-[#34D399]/20 text-[#34D399]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve Registration Request</h3>
                <p className="text-xs text-[#C9C4D6]">
                  Application #{approvingItem.id} · {approvingItem.fullName}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Role:</span>
                <span className="font-bold text-[#A855F7]">{approvingItem.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Entity / Business:</span>
                <span className="text-white font-medium">{approvingItem.businessName || 'Independent'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Location:</span>
                <span className="text-white">{approvingItem.upazila}, {approvingItem.district}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white flex items-center justify-between">
                <span>Compliance Audit Rationale</span>
                <span className="text-[10px] text-[#A855F7]">Recorded in Audit Log</span>
              </label>
              <textarea
                value={approvalAuditNote}
                onChange={(e) => setApprovalAuditNote(e.target.value)}
                placeholder="[AUDIT NOTE] e.g. Validated NID credentials and store location; authorized for platform clearance."
                rows={3}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#34D399]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                className="px-4 py-2 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingApproval}
                onClick={handleApprove}
                className="px-4 py-2 bg-[#34D399] hover:bg-[#10B981] disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {isSubmittingApproval ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Authorize & Log Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT ACTION MODAL WITH MANDATORY AUDIT RATIONALE                        */}
      {/* ========================================================================= */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#171226] border border-[#F87171]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#302741] pb-3 text-[#F87171]">
              <div className="p-2 rounded-xl bg-[#F87171]/20">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Registration Request</h3>
                <p className="text-xs text-[#C9C4D6]">
                  Application #{rejectingItem.id} · {rejectingItem.fullName}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F87171]/10 rounded-xl border border-[#F87171]/30 text-xs text-[#F87171] space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Mandatory Audit Trail Entry</span>
              </div>
              <p className="text-[11px] text-[#F87171]/90">
                An explicit audit reason is required for account rejection. This will be preserved in the immutable platform audit ledger.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white">
                Rejection Audit Rationale * (min 5 chars)
              </label>
              <textarea
                value={rejectionAuditReason}
                onChange={(e) => setRejectionAuditReason(e.target.value)}
                placeholder="[AUDIT REASON] e.g. Trade license expired or NID details mismatch with applicant identity."
                rows={3}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#F87171]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRejection || rejectionAuditReason.trim().length < 5}
                onClick={handleReject}
                className="px-4 py-2 bg-[#F87171] hover:bg-[#EF4444] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {isSubmittingRejection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                <span>Reject & Log Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL DOCUMENT IMAGE LIGHTBOX                                             */}
      {/* ========================================================================= */}
      {docModalUrl && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#302741] pb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#34D399]" />
                <span>{docModalUrl.name}</span>
              </span>
              <button
                onClick={() => setDocModalUrl(null)}
                className="text-[#C9C4D6] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black/40 border border-[#302741] p-2 flex items-center justify-center max-h-[60vh]">
              <img
                src={docModalUrl.url}
                alt={docModalUrl.name}
                className="max-h-[55vh] object-contain rounded-lg"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-[#C9C4D6]">
              <span>Verified DropNest Credential Scan</span>
              <button
                onClick={() => setDocModalUrl(null)}
                className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-bold cursor-pointer"
              >
                Done Viewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
