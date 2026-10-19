import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Globe,
  History,
  Image,
  Info,
  Laptop,
  Mail,
  MapPin,
  Maximize2,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tag,
  UserCheck,
  UserMinus,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';
import type { ContactHistoryEntry, UserVerificationAuditEntry, UserVerificationItem } from '../../../types/admin.ts';
import type { AuditRecord } from '../../../types/platform.ts';
import { StatusBadge } from '../../common/StatusBadge.tsx';

interface AdminUserApprovalModuleProps {
  initialSubmodule?: string;
}

export const AdminUserApprovalModule: React.FC<AdminUserApprovalModuleProps> = ({ initialSubmodule }) => {
  const [viewMode, setViewMode] = useState<'QUEUE' | 'AUDIT_LOGS'>(() => {
    if (initialSubmodule === 'Approval Audit Trail') return 'AUDIT_LOGS';
    return 'QUEUE';
  });

  const [verifications, setVerifications] = useState<UserVerificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Queue Filters
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'RESELLER' | 'SUPPLIER' | 'MODERATOR'>(() => {
    if (initialSubmodule === 'Supplier Approvals') return 'SUPPLIER';
    if (initialSubmodule === 'Reseller Approvals') return 'RESELLER';
    if (initialSubmodule === 'Moderator Approvals') return 'MODERATOR';
    return 'ALL';
  });
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Modals & Action States
  const [previewItem, setPreviewItem] = useState<UserVerificationItem | null>(null);
  const [historyItem, setHistoryItem] = useState<UserVerificationItem | null>(null);
  const [docModalUrl, setDocModalUrl] = useState<{ name: string; url: string } | null>(null);

  // Slide-over Drawer States
  const [slideOverItem, setSlideOverItem] = useState<UserVerificationItem | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<'PROFILE' | 'DOCS' | 'CONTACTS' | 'AUDIT'>('PROFILE');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactType, setContactType] = useState<'PHONE_CALL' | 'SMS_SENT' | 'EMAIL_DISPATCH' | 'WHATSAPP' | 'IN_PERSON_VISIT'>('PHONE_CALL');
  const [contactOutcome, setContactOutcome] = useState<'REACHED_VERIFIED' | 'CALL_BUSY' | 'UNREACHABLE' | 'FOLLOWUP_SCHEDULED' | 'EMAIL_DELIVERED' | 'DOCUMENT_REQUESTED'>('REACHED_VERIFIED');
  const [contactNotes, setContactNotes] = useState('');
  const [contactDuration, setContactDuration] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Approval Modal
  const [approvingItem, setApprovingItem] = useState<UserVerificationItem | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Rejection Modal
  const [rejectingItem, setRejectingItem] = useState<UserVerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Audit Log Search & Filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [verifRes, auditRes] = await Promise.all([
        ApiService.getUserVerifications(),
        ApiService.getAuditLogs(),
      ]);
      setVerifications(verifRes);
      // Filter verification-specific audit records
      const relevantAudits = auditRes.filter(
        (a) => a.action.startsWith('USER_VERIFICATION') || a.action.includes('USER_REGISTRATION')
      );
      setAuditLogs(relevantAudits);
    } catch (err: any) {
      console.error('Failed to load verification management data:', err);
      setFeedback({ text: 'Failed to load verification queue from server.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick preset rejection reasons
  const PRESET_REJECTION_REASONS = [
    'Invalid or expired Trade License document submitted.',
    'National ID (NID) number / name mismatch with applicant credentials.',
    'Mobile phone number unreachable after multiple verification attempts.',
    'Operating business address is outside DropNest courier serviceable zones.',
    'Incomplete documentation: Factory inspection or TIN certificate missing.',
    'Duplicate registration request with existing active account credentials.',
  ];

  // Actions
  const handleApprove = async () => {
    if (!approvingItem) return;
    setIsSubmittingApproval(true);
    try {
      const res = await ApiService.reviewUserVerification(
        approvingItem.id,
        'APPROVED',
        approvalNote.trim() || 'Approved after KYC credentials validation'
      );
      setFeedback({ text: res.message || `Application #${approvingItem.id} approved successfully.` });
      setApprovingItem(null);
      setApprovalNote('');
      if (previewItem?.id === approvingItem.id) setPreviewItem(null);
      if (slideOverItem?.id === approvingItem.id) {
        setSlideOverItem(res.item);
      }
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Approval failed.', isError: true });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setFeedback({ text: 'Please specify a valid rejection reason (minimum 5 characters).', isError: true });
      return;
    }
    setIsSubmittingRejection(true);
    try {
      const res = await ApiService.reviewUserVerification(
        rejectingItem.id,
        'REJECTED',
        rejectionReason.trim()
      );
      setFeedback({ text: res.message || `Application #${rejectingItem.id} rejected. Audit log recorded.` });
      setRejectingItem(null);
      setRejectionReason('');
      if (previewItem?.id === rejectingItem.id) setPreviewItem(null);
      if (slideOverItem?.id === rejectingItem.id) {
        setSlideOverItem(res.item);
      }
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Rejection failed.', isError: true });
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const handleUnderReview = async (id: string) => {
    try {
      const res = await ApiService.reviewUserVerification(id, 'UNDER_REVIEW', 'Application placed under operational review');
      setFeedback({ text: res.message || 'Application placed under review status.' });
      if (slideOverItem?.id === id) {
        setSlideOverItem(res.item);
      }
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Action failed.', isError: true });
    }
  };

  const handleAddContactLog = async () => {
    if (!slideOverItem) return;
    if (!contactNotes.trim()) {
      setFeedback({ text: 'Please enter detailed notes for this contact interaction.', isError: true });
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
      setFeedback({ text: `Contact interaction recorded for ${slideOverItem.fullName}.` });
      setSlideOverItem(res.item);
      setVerifications((prev) => prev.map((v) => (v.id === res.item.id ? res.item : v)));
      setContactNotes('');
      setContactDuration('');
      setIsAddingContact(false);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to log contact interaction.', isError: true });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Batch Approve
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);
    let successCount = 0;
    try {
      for (const id of selectedIds) {
        try {
          await ApiService.reviewUserVerification(id, 'APPROVED', 'Batch approved by Admin in compliance queue.');
          successCount++;
        } catch (e) {
          console.error(`Batch approval failed for ${id}:`, e);
        }
      }
      setFeedback({ text: `Successfully batch-approved ${successCount} registration request(s).` });
      setSelectedIds([]);
      loadData();
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Checkbox helpers
  const toggleSelectAll = (filteredList: UserVerificationItem[]) => {
    const selectable = filteredList.filter((v) => v.status === 'PENDING' || v.status === 'UNDER_REVIEW');
    if (selectedIds.length === selectable.length && selectable.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map((v) => v.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setFeedback({ text: `${label} "${text}" copied to clipboard.` });
  };

  // Stats calculation
  const totalPending = verifications.filter((v) => v.status === 'PENDING').length;
  const resellerPending = verifications.filter((v) => v.role === 'RESELLER' && v.status === 'PENDING').length;
  const supplierPending = verifications.filter((v) => v.role === 'SUPPLIER' && v.status === 'PENDING').length;
  const moderatorPending = verifications.filter((v) => v.role === 'MODERATOR' && v.status === 'PENDING').length;
  const totalApproved = verifications.filter((v) => v.status === 'APPROVED').length;
  const totalRejected = verifications.filter((v) => v.status === 'REJECTED').length;
  const totalUnderReview = verifications.filter((v) => v.status === 'UNDER_REVIEW').length;

  // Filtered Queue
  const filteredQueue = verifications
    .filter((item) => {
      if (roleFilter !== 'ALL' && item.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.fullName.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchRole = item.role.toLowerCase().includes(q);
        const matchBiz = item.businessName?.toLowerCase().includes(q);
        const matchMobile = item.mobile.includes(q);
        const matchDistrict = item.district.toLowerCase().includes(q);
        const matchUpazila = item.upazila.toLowerCase().includes(q);
        const matchTL = item.tradeLicense?.toLowerCase().includes(q);
        const matchTIN = item.tin?.toLowerCase().includes(q);
        const matchNID = item.nidNumber?.toLowerCase().includes(q);
        if (
          !matchName &&
          !matchEmail &&
          !matchRole &&
          !matchBiz &&
          !matchMobile &&
          !matchDistrict &&
          !matchUpazila &&
          !matchTL &&
          !matchTIN &&
          !matchNID
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.registrationDate).getTime();
      const timeB = new Date(b.registrationDate).getTime();
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: UserVerificationItem['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/30';
      case 'REJECTED':
        return 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30 font-bold';
      case 'UNDER_REVIEW':
        return 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30';
      case 'BLOCKED':
        return 'bg-[#F87171]/30 text-[#F87171] border-[#F87171]/50';
      case 'PENDING':
      default:
        return 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30 animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.isError
              ? 'bg-[#F87171]/10 border-[#F87171]/40 text-[#F87171]'
              : 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {feedback.isError ? <AlertOctagon className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Main Console Header */}
      <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#A855F7]">
              Compliance & Verification Desk
            </span>
            {totalPending > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EC4899] text-white animate-pulse">
                {totalPending} Awaiting Action
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">
            Approval Management & KYC Verification
          </h1>
          <p className="text-xs text-[#C9C4D6] mt-0.5 max-w-3xl">
            Review submitted credentials from Bangladesh Resellers & Suppliers. Grant platform clearance, enforce audit rationale on rejection, and maintain immutable decision logs.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-[#100D1B] p-1 rounded-xl border border-[#302741]">
            <button
              onClick={() => setViewMode('QUEUE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'QUEUE'
                  ? 'bg-[#7C3AED] text-white shadow-md'
                  : 'text-[#C9C4D6] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Queue ({filteredQueue.length})</span>
            </button>

            <button
              onClick={() => setViewMode('AUDIT_LOGS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'AUDIT_LOGS'
                  ? 'bg-[#7C3AED] text-white shadow-md'
                  : 'text-[#C9C4D6] hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail ({auditLogs.length})</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors flex items-center gap-1.5"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => { setViewMode('QUEUE'); setStatusFilter('PENDING'); setRoleFilter('ALL'); }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'PENDING' && viewMode === 'QUEUE'
              ? 'bg-[#FBBF24]/20 border-[#FBBF24]'
              : 'bg-[#171226] border-[#302741] hover:border-[#FBBF24]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#FBBF24]">Total Pending</span>
            <Clock className="w-3.5 h-3.5 text-[#FBBF24]" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{totalPending}</p>
          <p className="text-[10px] text-[#C9C4D6]">Awaiting review</p>
        </div>

        <div
          onClick={() => { setViewMode('QUEUE'); setRoleFilter('RESELLER'); setStatusFilter('PENDING'); }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            roleFilter === 'RESELLER' && statusFilter === 'PENDING' && viewMode === 'QUEUE'
              ? 'bg-[#7C3AED]/20 border-[#7C3AED]'
              : 'bg-[#171226] border-[#302741] hover:border-[#7C3AED]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#A855F7]">Pending Resellers</span>
            <Users className="w-3.5 h-3.5 text-[#A855F7]" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{resellerPending}</p>
          <p className="text-[10px] text-[#C9C4D6]">Storefront applicants</p>
        </div>

        <div
          onClick={() => { setViewMode('QUEUE'); setRoleFilter('SUPPLIER'); setStatusFilter('PENDING'); }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            roleFilter === 'SUPPLIER' && statusFilter === 'PENDING' && viewMode === 'QUEUE'
              ? 'bg-[#22D3EE]/20 border-[#22D3EE]'
              : 'bg-[#171226] border-[#302741] hover:border-[#22D3EE]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#22D3EE]">Pending Suppliers</span>
            <Building2 className="w-3.5 h-3.5 text-[#22D3EE]" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{supplierPending}</p>
          <p className="text-[10px] text-[#C9C4D6]">Wholesale merchants</p>
        </div>

        <div
          onClick={() => { setViewMode('QUEUE'); setStatusFilter('UNDER_REVIEW'); setRoleFilter('ALL'); }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'UNDER_REVIEW' && viewMode === 'QUEUE'
              ? 'bg-[#22D3EE]/20 border-[#22D3EE]'
              : 'bg-[#171226] border-[#302741] hover:border-[#22D3EE]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#22D3EE]">Under Review</span>
            <FileText className="w-3.5 h-3.5 text-[#22D3EE]" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{totalUnderReview}</p>
          <p className="text-[10px] text-[#C9C4D6]">Needs docs</p>
        </div>

        <div
          onClick={() => { setViewMode('QUEUE'); setStatusFilter('APPROVED'); setRoleFilter('ALL'); }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'APPROVED' && viewMode === 'QUEUE'
              ? 'bg-[#34D399]/20 border-[#34D399]'
              : 'bg-[#171226] border-[#302741] hover:border-[#34D399]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#34D399]">Approved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{totalApproved}</p>
          <p className="text-[10px] text-[#34D399]">Active credentials</p>
        </div>

        <div
          onClick={() => { setViewMode('QUEUE'); setStatusFilter('REJECTED'); setRoleFilter('ALL'); }}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'REJECTED' && viewMode === 'QUEUE'
              ? 'bg-[#F87171]/20 border-[#F87171]'
              : 'bg-[#171226] border-[#302741] hover:border-[#F87171]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#F87171]">Rejected</span>
            <XCircle className="w-3.5 h-3.5 text-[#F87171]" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{totalRejected}</p>
          <p className="text-[10px] text-[#F87171]">Logged with rationale</p>
        </div>
      </div>

      {/* VIEW 1: REGISTRATION APPLICATIONS QUEUE */}
      {viewMode === 'QUEUE' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Role Filter */}
              <div className="flex items-center gap-1 bg-[#100D1B] p-1 rounded-xl border border-[#302741]">
                {[
                  { id: 'ALL', label: 'All Roles' },
                  { id: 'RESELLER', label: 'Resellers' },
                  { id: 'SUPPLIER', label: 'Suppliers' },
                  { id: 'MODERATOR', label: 'Moderators' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRoleFilter(r.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      roleFilter === r.id ? 'bg-[#7C3AED] text-white shadow' : 'text-[#C9C4D6] hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#100D1B] p-1 rounded-xl border border-[#302741]">
                {[
                  { id: 'ALL', label: 'All Status' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'UNDER_REVIEW', label: 'Review' },
                  { id: 'APPROVED', label: 'Approved' },
                  { id: 'REJECTED', label: 'Rejected' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      statusFilter === s.id ? 'bg-[#7C3AED] text-white shadow' : 'text-[#C9C4D6] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input & Sort */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#C9C4D6]" />
                <input
                  type="text"
                  placeholder="Filter by name, email, phone, role, NID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-xs text-[#C9C4D6] hover:text-white"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-[#100D1B] border border-[#302741] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Batch Action Bar (if items selected) */}
          {selectedIds.length > 0 && (
            <div className="bg-[#7C3AED]/15 border border-[#7C3AED]/40 p-3.5 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-[#A855F7]" />
                <span className="font-bold text-white">
                  {selectedIds.length} application(s) selected
                </span>
                <span className="text-[#C9C4D6]">| Ready for batch triage</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchApprove}
                  disabled={isBatchProcessing}
                  className="px-3.5 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-black font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
                >
                  {isBatchProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Batch Approve ({selectedIds.length})</span>
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-[#C9C4D6] hover:text-white rounded-xl transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Applications Table */}
          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length ===
                            filteredQueue.filter((v) => v.status === 'PENDING' || v.status === 'UNDER_REVIEW').length
                        }
                        onChange={() => toggleSelectAll(filteredQueue)}
                        className="rounded accent-[#7C3AED] cursor-pointer"
                        title="Select All Pending"
                      />
                    </th>
                    <th className="py-3 px-4">Application ID & Date</th>
                    <th className="py-3 px-4">Applicant & Entity</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Contact & Location</th>
                    <th className="py-3 px-4">Submitted Credentials</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions & Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#C9C4D6]">
                        <UserCheck className="w-8 h-8 mx-auto text-[#C9C4D6]/40 mb-2" />
                        <p className="font-semibold text-white">No applications match your filter.</p>
                        <p className="text-[11px] text-[#C9C4D6]/70 mt-0.5">
                          Try switching status to ALL or clearing your search query.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => {
                      const isSelectable = item.status === 'PENDING' || item.status === 'UNDER_REVIEW';
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-[#1A142B] transition-colors ${
                            isSelected ? 'bg-[#7C3AED]/10' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3">
                            {isSelectable ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(item.id)}
                                className="rounded accent-[#7C3AED] cursor-pointer"
                              />
                            ) : (
                              <span className="text-[#C9C4D6]/30">—</span>
                            )}
                          </td>

                          {/* App ID & Date */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#A855F7] block">
                              {item.id}
                            </span>
                            <span className="text-[10px] text-[#C9C4D6]/70 block mt-0.5">
                              {formatBangladeshDateTime(item.registrationDate)}
                            </span>
                          </td>

                          {/* Applicant & Entity */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-xs font-bold text-[#A855F7] shrink-0">
                                {item.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <button
                                  onClick={() => {
                                    setSlideOverItem(item);
                                    setSlideOverTab('PROFILE');
                                  }}
                                  className="font-semibold text-white hover:text-[#A855F7] block truncate text-left transition-colors cursor-pointer"
                                  title="Click to expand user details"
                                >
                                  {item.fullName}
                                </button>
                                <span className="text-[11px] text-[#A855F7] block truncate font-mono" title={item.email}>
                                  {item.email}
                                </span>
                                <span className="text-[10px] text-[#C9C4D6] flex items-center gap-1 truncate">
                                  <Building2 className="w-3 h-3 text-[#22D3EE] shrink-0" />
                                  <span>{item.businessName || 'Independent Seller'}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.role === 'RESELLER'
                                  ? 'bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30'
                                  : item.role === 'SUPPLIER'
                                  ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                                  : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                              }`}
                            >
                              {item.role === 'RESELLER' ? (
                                <Smartphone className="w-2.5 h-2.5" />
                              ) : item.role === 'SUPPLIER' ? (
                                <Building2 className="w-2.5 h-2.5" />
                              ) : (
                                <Shield className="w-2.5 h-2.5" />
                              )}
                              <span>{item.role}</span>
                            </span>
                          </td>

                          {/* Contact & Location */}
                          <td className="py-3 px-4 text-xs">
                            <div className="flex items-center gap-1 font-mono text-[#22D3EE]">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{item.mobile}</span>
                              <button
                                onClick={() => copyToClipboard(item.mobile, 'Phone')}
                                className="text-[#C9C4D6] hover:text-white ml-0.5"
                                title="Copy mobile number"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="text-[10px] text-[#C9C4D6] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#C9C4D6]/70 shrink-0" />
                              <span>{item.upazila}, {item.district}</span>
                            </div>
                          </td>

                          {/* Submitted Credentials */}
                          <td className="py-3 px-4 font-mono text-xs">
                            {item.tradeLicense ? (
                              <div className="truncate max-w-[170px]" title={item.tradeLicense}>
                                <span className="text-[#C9C4D6] text-[10px]">TL: </span>
                                <span className="text-white font-bold">{item.tradeLicense}</span>
                              </div>
                            ) : item.nidNumber ? (
                              <div className="truncate max-w-[170px]">
                                <span className="text-[#C9C4D6] text-[10px]">NID: </span>
                                <span className="text-white font-bold">{item.nidNumber}</span>
                              </div>
                            ) : (
                              <span className="text-[#C9C4D6]/60 text-[11px]">Self-Certified</span>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-[#34D399] mt-0.5">
                              <FileCheck className="w-3 h-3 text-[#34D399]" />
                              <span>{item.verificationDocs.length} Verified Doc(s)</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={item.status} size="xs" showIcon={true} />
                            {item.reviewedBy && (
                              <span className="block text-[9px] text-[#C9C4D6]/70 mt-1 truncate max-w-[120px] mx-auto">
                                by {item.reviewedBy}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Expand Details (Slide-over drawer) Button */}
                              <button
                                onClick={() => {
                                  setSlideOverItem(item);
                                  setSlideOverTab('PROFILE');
                                }}
                                className="px-2.5 py-1.5 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/35 border border-[#7C3AED]/50 text-[#A855F7] hover:text-white text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                title="Expand Details: Slide-over Profile, Contact History & Documents"
                              >
                                <PanelRightOpen className="w-3.5 h-3.5 text-[#A855F7]" />
                                <span>Expand Details</span>
                              </button>

                              {/* Inspect Documents Button */}
                              <button
                                onClick={() => {
                                  setSlideOverItem(item);
                                  setSlideOverTab('DOCS');
                                }}
                                className="px-2 py-1.5 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-[#C9C4D6] hover:text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Inspect Verification Documents"
                              >
                                <Eye className="w-3 h-3 text-[#22D3EE]" />
                                <span>Docs</span>
                              </button>

                              {/* View Audit Trail */}
                              <button
                                onClick={() => setHistoryItem(item)}
                                className="p-1.5 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-[#C9C4D6] hover:text-white rounded-lg transition-colors"
                                title="View Decision Audit Trail"
                              >
                                <History className="w-3.5 h-3.5 text-[#A855F7]" />
                              </button>

                              {/* Approve Button */}
                              {item.status !== 'APPROVED' && (
                                <button
                                  onClick={() => {
                                    setApprovingItem(item);
                                    setApprovalNote('');
                                  }}
                                  className="px-3 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                                  title="Approve & Grant Clearance"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* Reject Button */}
                              {item.status !== 'REJECTED' && (
                                <button
                                  onClick={() => {
                                    setRejectingItem(item);
                                    setRejectionReason('');
                                  }}
                                  className="px-2.5 py-1.5 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                                  title="Reject with Audit Rationale"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              )}
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
        </div>
      )}

      {/* VIEW 2: DEDICATED AUDIT LOGS TRAIL */}
      {viewMode === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#C9C4D6]" />
              <input
                type="text"
                placeholder="Search audit trail by admin actor name, applicant details, or action..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#100D1B] border border-[#302741] rounded-xl text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="ALL">All Audit Actions</option>
                <option value="USER_VERIFICATION_APPROVED">Approved Decisions</option>
                <option value="USER_VERIFICATION_REJECTED">Rejected Decisions</option>
                <option value="USER_VERIFICATION_UNDER_REVIEW">Under Review Decisions</option>
                <option value="USER_REGISTRATION">Initial Submissions</option>
              </select>
            </div>
          </div>

          <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#100D1B] text-[#C9C4D6] uppercase tracking-wider text-[10px] font-semibold border-b border-[#302741]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Code</th>
                    <th className="py-3 px-4">Audited Admin (Actor)</th>
                    <th className="py-3 px-4">Compliance Rationale & Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#302741]/50 text-white">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-xs text-[#C9C4D6]">
                        No verification audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#1A142B] transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#C9C4D6] whitespace-nowrap">
                          {formatBangladeshDateTime(log.timestamp)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              log.action.includes('APPROVED')
                                ? 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/30'
                                : log.action.includes('REJECTED')
                                ? 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30'
                                : 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{log.actorName}</span>
                          <span className="text-[10px] text-[#A855F7] font-mono block">
                            Role: {log.actorRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#C9C4D6] leading-relaxed">
                          {log.details}
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

      {/* MODAL 1: APPROVE CONFIRMATION WITH AUDIT NOTE */}
      {approvingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#171226] border border-[#34D399]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#302741] pb-3">
              <div className="p-2 rounded-xl bg-[#34D399]/20 text-[#34D399]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Authorize Registration Clearance</h3>
                <p className="text-xs text-[#C9C4D6]">Application #{approvingItem.id}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#100D1B] border border-[#302741] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Applicant:</span>
                <span className="font-semibold text-white">{approvingItem.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Business:</span>
                <span className="text-white">{approvingItem.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Account Type:</span>
                <span className="font-bold text-[#A855F7]">{approvingItem.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Mobile:</span>
                <span className="font-mono text-[#22D3EE]">{approvingItem.mobile}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white">
                Approval Verification Remarks / Audit Rationale
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Trade license cross-checked with City Corporation portal; physical store address verified."
                rows={3}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#34D399]"
              />
              <span className="text-[10px] text-[#C9C4D6]/70 block">
                This note is recorded into the immutable compliance audit ledger.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovingItem(null)}
                className="px-4 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleApprove}
                disabled={isSubmittingApproval}
                className="px-4 py-2 bg-[#34D399] hover:bg-[#10B981] disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
              >
                {isSubmittingApproval ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm & Activate Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT WITH MANDATORY AUDIT RATIONALE */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#171226] border border-[#F87171]/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#302741] pb-3 text-[#F87171]">
              <div className="p-2 rounded-xl bg-[#F87171]/20">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Registration Request</h3>
                <p className="text-xs text-[#C9C4D6]">Application #{rejectingItem.id} · {rejectingItem.fullName}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/30 text-xs text-[#F87171] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Mandatory Compliance Audit Trail</span>
              </span>
              <p className="text-[11px] text-[#F87171]/90">
                Platform governance requires an explicit rejection reason. This rationale will be permanently recorded in the system audit log and communicated to the applicant.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#C9C4D6]">
                Select Quick Preset Reason:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_REJECTION_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10px] text-left p-1.5 rounded-lg bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] hover:border-[#F87171]/50 text-[#C9C4D6] hover:text-white transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white">
                Detailed Rejection Rationale *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify exact compliance deficiency or document issue (min 5 characters)..."
                rows={3}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#F87171]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleReject}
                disabled={isSubmittingRejection || rejectionReason.trim().length < 5}
                className="px-4 py-2 bg-[#F87171] hover:bg-[#EF4444] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
              >
                {isSubmittingRejection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                <span>Reject & Log to Audit Trail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KYC DOCUMENT & PROFILE INSPECTOR */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">KYC Dossier & Credentials</h3>
                  <StatusBadge status={previewItem.status} size="sm" showIcon={true} />
                </div>
                <p className="text-xs text-[#A855F7] font-semibold mt-0.5">
                  {previewItem.fullName} · {previewItem.businessName} ({previewItem.role})
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-[#100D1B] p-3.5 rounded-xl border border-[#302741]">
              <div>
                <span className="text-[#C9C4D6] text-[10px] block">Mobile:</span>
                <span className="font-mono text-[#22D3EE] font-bold">{previewItem.mobile}</span>
              </div>
              <div>
                <span className="text-[#C9C4D6] text-[10px] block">Email:</span>
                <span className="text-white font-medium truncate block">{previewItem.email}</span>
              </div>
              <div>
                <span className="text-[#C9C4D6] text-[10px] block">Location:</span>
                <span className="text-white font-medium">{previewItem.upazila}, {previewItem.district}</span>
              </div>

              {previewItem.tradeLicense && (
                <div className="sm:col-span-2">
                  <span className="text-[#C9C4D6] text-[10px] block">Trade License Number:</span>
                  <span className="font-mono text-[#22D3EE] font-bold">{previewItem.tradeLicense}</span>
                </div>
              )}

              {previewItem.tin && (
                <div>
                  <span className="text-[#C9C4D6] text-[10px] block">TIN Number:</span>
                  <span className="font-mono text-[#34D399] font-bold">{previewItem.tin}</span>
                </div>
              )}

              {previewItem.nidNumber && (
                <div className="sm:col-span-2">
                  <span className="text-[#C9C4D6] text-[10px] block">National ID (NID):</span>
                  <span className="font-mono text-[#A855F7] font-bold">{previewItem.nidNumber}</span>
                </div>
              )}

              {previewItem.productCategory && (
                <div>
                  <span className="text-[#C9C4D6] text-[10px] block">Wholesale Category:</span>
                  <span className="text-white font-medium">{previewItem.productCategory}</span>
                </div>
              )}
            </div>

            {/* Attached Verification Documents */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">
                Attached Verification Proofs ({previewItem.verificationDocs.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewItem.verificationDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#100D1B] border border-[#302741] rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#A855F7] shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{doc.name}</p>
                        <p className="text-[10px] text-[#C9C4D6]/70 uppercase">{doc.type}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setDocModalUrl(doc)}
                      className="px-2.5 py-1 bg-[#171226] hover:bg-[#251E3A] border border-[#302741] text-[#22D3EE] text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Prior Review Notes if any */}
            {previewItem.rejectionReason && (
              <div className="p-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/30 text-xs text-[#F87171] space-y-1">
                <span className="font-bold block">Recorded Rejection Rationale:</span>
                <p className="text-[11px] text-[#F87171]/90">{previewItem.rejectionReason}</p>
              </div>
            )}

            {/* Direct Status Actions in Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#302741]">
              <button
                onClick={() => {
                  setHistoryItem(previewItem);
                }}
                className="text-xs text-[#A855F7] hover:underline flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>View Complete Audit History</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
                >
                  Close
                </button>

                {previewItem.status !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      setApprovingItem(previewItem);
                    }}
                    className="px-4 py-2 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Application</span>
                  </button>
                )}

                {previewItem.status !== 'REJECTED' && (
                  <button
                    onClick={() => {
                      setRejectingItem(previewItem);
                    }}
                    className="px-3.5 py-2 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL DOCUMENT IMAGE LIGHTBOX */}
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
                className="text-[#C9C4D6] hover:text-white"
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
                className="px-4 py-1.5 bg-[#7C3AED] text-white rounded-lg font-bold"
              >
                Done Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SPECIFIC APPLICANT AUDIT TRAIL TIMELINE */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#A855F7]" />
                <div>
                  <h3 className="text-sm font-bold text-white">Compliance Audit Trail</h3>
                  <p className="text-xs text-[#C9C4D6]">
                    {historyItem.fullName} ({historyItem.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="text-[#C9C4D6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(!historyItem.auditTrail || historyItem.auditTrail.length === 0) ? (
                <div className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] text-xs text-[#C9C4D6] text-center">
                  Initial application submitted on {formatBangladeshDateTime(historyItem.registrationDate)}.
                </div>
              ) : (
                historyItem.auditTrail.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-[#100D1B] border border-[#302741] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {entry.previousStatus && entry.previousStatus !== (entry.newStatus || entry.action) && (
                          <span className="text-[10px] text-[#C9C4D6] font-mono flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-[#171226] border border-[#302741] text-[#C9C4D6]">
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

                    <div className="text-white font-medium flex items-center justify-between text-xs">
                      <span>Actor: <strong className="text-[#A855F7]">{entry.actorName}</strong></span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30 font-mono">
                        Role: {entry.actorRole}
                      </span>
                    </div>

                    {entry.notes && (
                      <p className="text-[11px] text-[#C9C4D6] bg-[#171226] p-2 rounded-lg border border-[#302741]">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryItem(null)}
                className="px-4 py-2 bg-[#302741] hover:bg-[#3E3354] rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: EXPAND DETAILS VIEW */}
      {slideOverItem && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
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
                      ) : slideOverItem.role === 'SUPPLIER' ? (
                        <Building2 className="w-2.5 h-2.5" />
                      ) : (
                        <Shield className="w-2.5 h-2.5" />
                      )}
                      <span>{slideOverItem.role}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {slideOverItem.status !== 'APPROVED' && (
                      <button
                        onClick={() => {
                          setApprovingItem(slideOverItem);
                          setApprovalNote('');
                        }}
                        className="px-3 py-1.5 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
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
                          setRejectionReason('');
                        }}
                        className="px-3 py-1.5 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
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
                      className="p-1.5 rounded-lg text-[#C9C4D6] hover:text-white hover:bg-[#302741] transition-colors"
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
                        <span className="flex items-center gap-1 text-[11px] text-[#C9C4D6]/70">
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
                    <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#22D3EE]" />
                          <span className="font-mono text-xs font-bold text-white">{slideOverItem.mobile}</span>
                          <button
                            onClick={() => copyToClipboard(slideOverItem.mobile, 'Mobile number')}
                            className="p-1 text-[#C9C4D6] hover:text-white transition-colors"
                            title="Copy Phone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${slideOverItem.mobile}`}
                            className="text-[11px] text-[#22D3EE] hover:underline ml-1"
                          >
                            Call
                          </a>
                        </div>

                        <div className="flex items-center gap-2 border-l border-[#302741] pl-4">
                          <Mail className="w-4 h-4 text-[#A855F7]" />
                          <span className="text-xs text-white truncate max-w-[200px]" title={slideOverItem.email}>
                            {slideOverItem.email}
                          </span>
                          <button
                            onClick={() => copyToClipboard(slideOverItem.email, 'Email address')}
                            className="p-1 text-[#C9C4D6] hover:text-white transition-colors"
                            title="Copy Email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`mailto:${slideOverItem.email}`}
                            className="text-[11px] text-[#A855F7] hover:underline ml-1"
                          >
                            Email
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/88${slideOverItem.mobile.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#34D399] border border-[#34D399]/40 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => {
                            setSlideOverTab('CONTACTS');
                            setIsAddingContact(true);
                          }}
                          className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Log Call/SMS</span>
                        </button>
                      </div>
                    </div>

                    {/* Commercial Credentials Grid */}
                    <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-[#302741] pb-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A855F7] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Commercial Credentials & Identification</span>
                        </h3>
                        <span className="text-[11px] text-[#C9C4D6]">Bangladesh Registry</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                        <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] uppercase tracking-wider block">Trade License</span>
                          <span className="font-mono font-bold text-white block mt-0.5 truncate">
                            {slideOverItem.tradeLicense || 'Not Applicable / Self-Certified'}
                          </span>
                        </div>

                        <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] uppercase tracking-wider block">Tax ID (TIN)</span>
                          <span className="font-mono font-bold text-[#34D399] block mt-0.5 truncate">
                            {slideOverItem.tin || 'Under Submission'}
                          </span>
                        </div>

                        <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] uppercase tracking-wider block">National ID (NID)</span>
                          <span className="font-mono font-bold text-[#22D3EE] block mt-0.5 truncate">
                            {slideOverItem.nidNumber || 'Not Stated'}
                          </span>
                        </div>

                        <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741] sm:col-span-2">
                          <span className="text-[10px] text-[#C9C4D6] uppercase tracking-wider block">Operational Address</span>
                          <span className="font-medium text-white block mt-0.5">
                            {slideOverItem.address || `${slideOverItem.upazila}, ${slideOverItem.district}, Bangladesh`}
                          </span>
                        </div>

                        <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] uppercase tracking-wider block">Merchant Category</span>
                          <span className="font-medium text-white block mt-0.5">
                            {slideOverItem.productCategory || 'Multi-Category Retail & Dropshipping'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Payout Destination */}
                    <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#302741] pb-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4" />
                          <span>Payout & Banking Destination</span>
                        </h3>
                        <span className="text-[10px] text-[#34D399] font-bold">BDT Automated Settlement</span>
                      </div>

                      {slideOverItem.bankDetails ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                            <span className="text-[10px] text-[#C9C4D6] block">Bank / Gateway</span>
                            <span className="font-bold text-white block mt-0.5">{slideOverItem.bankDetails.bankName}</span>
                          </div>
                          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                            <span className="text-[10px] text-[#C9C4D6] block">Account Name</span>
                            <span className="font-medium text-white block mt-0.5 truncate">{slideOverItem.bankDetails.accountName}</span>
                          </div>
                          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                            <span className="text-[10px] text-[#C9C4D6] block">Account Number</span>
                            <span className="font-mono font-bold text-[#22D3EE] block mt-0.5 truncate">{slideOverItem.bankDetails.accountNumber}</span>
                          </div>
                          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                            <span className="text-[10px] text-[#C9C4D6] block">Branch & Routing</span>
                            <span className="font-mono text-white block mt-0.5 truncate">
                              {slideOverItem.bankDetails.branchName || 'Online'} {slideOverItem.bankDetails.routingNumber ? `(${slideOverItem.bankDetails.routingNumber})` : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-[#100D1B] rounded-xl border border-[#302741] text-xs text-[#C9C4D6]">
                          Primary payout method linked to registered phone number: <strong className="text-white">{slideOverItem.mobile} (bKash/Nagad)</strong>.
                        </div>
                      )}
                    </div>

                    {/* Telemetry & Digital Footprint */}
                    <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#302741] pb-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] flex items-center gap-1.5">
                          <Laptop className="w-4 h-4" />
                          <span>Digital Footprint & Device Fingerprint</span>
                        </h3>
                        <span className="text-[10px] text-[#C9C4D6]">Registration Telemetry</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] block">IP Address & Network</span>
                          <span className="font-mono font-bold text-[#22D3EE] block mt-0.5 truncate">
                            {slideOverItem.ipAddress || '103.114.98.22 (Dhaka/Chittagong BDIX)'}
                          </span>
                        </div>

                        <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                          <span className="text-[10px] text-[#C9C4D6] block">Device & User Agent</span>
                          <span className="font-medium text-white block mt-0.5 truncate">
                            {slideOverItem.deviceInfo || 'Android Chrome / Mobile Client'}
                          </span>
                        </div>

                        {slideOverItem.socialLinks?.facebook && (
                          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                            <span className="text-[10px] text-[#C9C4D6] block">Facebook Page / Storefront</span>
                            <a
                              href={slideOverItem.socialLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#A855F7] hover:underline flex items-center gap-1 mt-0.5 truncate"
                            >
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{slideOverItem.socialLinks.facebook}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}

                        {slideOverItem.socialLinks?.website && (
                          <div className="p-3 bg-[#100D1B] rounded-xl border border-[#302741]">
                            <span className="text-[10px] text-[#C9C4D6] block">Corporate Website</span>
                            <a
                              href={slideOverItem.socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#22D3EE] hover:underline flex items-center gap-1 mt-0.5 truncate"
                            >
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{slideOverItem.socialLinks.website}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Applicant Bio */}
                    {slideOverItem.applicantBio && (
                      <div className="bg-[#171226] border border-[#302741] p-5 rounded-2xl space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9C4D6] flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-[#A855F7]" />
                          <span>Applicant Business Statement / Experience</span>
                        </h3>
                        <p className="text-xs text-white leading-relaxed bg-[#100D1B] p-3.5 rounded-xl border border-[#302741]">
                          {slideOverItem.applicantBio}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: VERIFICATION DOCUMENTS */}
                {slideOverTab === 'DOCS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">Submitted Compliance Documents</h3>
                        <p className="text-xs text-[#C9C4D6]">
                          {slideOverItem.verificationDocs?.length || 0} document file(s) attached to application dossier.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSlideOverTab('CONTACTS');
                          setIsAddingContact(true);
                          setContactOutcome('DOCUMENT_REQUESTED');
                        }}
                        className="px-3 py-1.5 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-[#A855F7] rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Request Extra Document</span>
                      </button>
                    </div>

                    {(!slideOverItem.verificationDocs || slideOverItem.verificationDocs.length === 0) ? (
                      <div className="p-8 text-center bg-[#171226] border border-[#302741] rounded-2xl text-xs text-[#C9C4D6]">
                        <FileText className="w-8 h-8 mx-auto text-[#C9C4D6]/40 mb-2" />
                        <p className="font-semibold text-white">No documents uploaded yet.</p>
                        <p className="text-[11px] text-[#C9C4D6]/70 mt-0.5">
                          Applicant self-registered without attaching external files.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {slideOverItem.verificationDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="bg-[#171226] border border-[#302741] hover:border-[#7C3AED]/50 p-4 rounded-2xl space-y-3 transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              {/* Preview Box */}
                              <div
                                onClick={() => setDocModalUrl(doc)}
                                className="relative h-36 bg-[#100D1B] rounded-xl border border-[#302741] overflow-hidden group cursor-pointer flex items-center justify-center"
                              >
                                <img
                                  src={doc.url}
                                  alt={doc.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <span className="px-3 py-1.5 bg-[#7C3AED] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>Inspect Document</span>
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white truncate" title={doc.name}>
                                    {doc.name}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                      doc.verified
                                        ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
                                        : 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30'
                                    }`}
                                  >
                                    {doc.verified ? 'Verified' : 'Pending KYC'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-[#C9C4D6] mt-1 font-mono">
                                  <span>{doc.type}</span>
                                  <span>{doc.fileSize || '1.8 MB'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#302741]/50 text-xs">
                              <span className="text-[10px] text-[#C9C4D6]/70">
                                Uploaded {formatBangladeshDateTime(doc.uploadDate || slideOverItem.registrationDate)}
                              </span>

                              <button
                                onClick={() => setDocModalUrl(doc)}
                                className="px-2.5 py-1 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-[#22D3EE] font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CONTACT HISTORY & INTERACTIONS */}
                {slideOverTab === 'CONTACTS' && (
                  <div className="space-y-4">
                    <div className="bg-[#171226] border border-[#302741] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-[#22D3EE]" />
                          <span>Admin Contact & Verification Outreach History</span>
                        </h3>
                        <p className="text-xs text-[#C9C4D6] mt-0.5">
                          Audit trail of telephone calls, SMS dispatches, WhatsApp chats, and in-person field inspections.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsAddingContact(!isAddingContact)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm ${
                          isAddingContact
                            ? 'bg-[#302741] text-white hover:bg-[#3E3354]'
                            : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'
                        }`}
                      >
                        {isAddingContact ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isAddingContact ? 'Cancel Log' : '+ Log New Interaction'}</span>
                      </button>
                    </div>

                    {/* NEW CONTACT INTERACTION FORM */}
                    {isAddingContact && (
                      <div className="bg-[#1A142B] border border-[#7C3AED]/40 p-5 rounded-2xl space-y-4 shadow-xl animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-[#302741] pb-2">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[#A855F7]">
                            <Send className="w-3.5 h-3.5" />
                            <span>Record Verification Interaction</span>
                          </h4>
                          <span className="text-[10px] text-[#C9C4D6]">Appends to applicant record</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Method */}
                          <div>
                            <label className="block text-xs font-semibold text-[#C9C4D6] mb-1">
                              Contact Channel / Method
                            </label>
                            <select
                              value={contactType}
                              onChange={(e) => setContactType(e.target.value as any)}
                              className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                            >
                              <option value="PHONE_CALL">Telephone Call</option>
                              <option value="SMS_SENT">SMS Alert / Notice</option>
                              <option value="WHATSAPP">WhatsApp Message</option>
                              <option value="EMAIL_DISPATCH">Email Dispatch</option>
                              <option value="IN_PERSON_VISIT">In-Person Field Visit</option>
                            </select>
                          </div>

                          {/* Outcome */}
                          <div>
                            <label className="block text-xs font-semibold text-[#C9C4D6] mb-1">
                              Call / Interaction Outcome
                            </label>
                            <select
                              value={contactOutcome}
                              onChange={(e) => setContactOutcome(e.target.value as any)}
                              className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                            >
                              <option value="REACHED_VERIFIED">Reached & Verified</option>
                              <option value="CALL_BUSY">Line Busy / No Answer</option>
                              <option value="UNREACHABLE">Unreachable / Switched Off</option>
                              <option value="FOLLOWUP_SCHEDULED">Follow-up Call Scheduled</option>
                              <option value="DOCUMENT_REQUESTED">Extra Documents Requested</option>
                              <option value="EMAIL_DELIVERED">Email Notification Sent</option>
                            </select>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="block text-xs font-semibold text-[#C9C4D6] mb-1">
                              Call Duration (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 3m 45s"
                              value={contactDuration}
                              onChange={(e) => setContactDuration(e.target.value)}
                              className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#C9C4D6] mb-1">
                            Interaction Summary & Compliance Findings *
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Detail what was discussed with applicant, answers to KYC screening questions, address verification details..."
                            value={contactNotes}
                            onChange={(e) => setContactNotes(e.target.value)}
                            className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingContact(false)}
                            className="px-4 py-2 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingContact || !contactNotes.trim()}
                            onClick={handleAddContactLog}
                            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
                          >
                            {isSubmittingContact ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Save to Contact History</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CONTACT HISTORY TIMELINE */}
                    <div className="space-y-3">
                      {(!slideOverItem.contactHistory || slideOverItem.contactHistory.length === 0) ? (
                        <div className="p-8 text-center bg-[#171226] border border-[#302741] rounded-2xl text-xs text-[#C9C4D6]">
                          <Phone className="w-8 h-8 mx-auto text-[#C9C4D6]/40 mb-2" />
                          <p className="font-semibold text-white">No direct contact attempts logged yet.</p>
                          <p className="text-[11px] text-[#C9C4D6]/70 mt-0.5">
                            Click "+ Log New Interaction" above to record phone verification or SMS dispatches.
                          </p>
                        </div>
                      ) : (
                        slideOverItem.contactHistory.map((entry) => {
                          let outcomeBadgeClass = 'bg-[#302741] text-[#C9C4D6] border-[#302741]';
                          if (entry.outcome === 'REACHED_VERIFIED') outcomeBadgeClass = 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/30';
                          else if (entry.outcome === 'CALL_BUSY') outcomeBadgeClass = 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30';
                          else if (entry.outcome === 'UNREACHABLE') outcomeBadgeClass = 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30';
                          else if (entry.outcome === 'FOLLOWUP_SCHEDULED') outcomeBadgeClass = 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30';
                          else if (entry.outcome === 'DOCUMENT_REQUESTED') outcomeBadgeClass = 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/30';
                          else if (entry.outcome === 'EMAIL_DELIVERED') outcomeBadgeClass = 'bg-[#60A5FA]/20 text-[#60A5FA] border-[#60A5FA]/30';

                          return (
                            <div
                              key={entry.id}
                              className="bg-[#171226] border border-[#302741] p-4 rounded-2xl space-y-2.5 transition-colors hover:border-[#7C3AED]/40"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-1.5 rounded-lg bg-[#100D1B] border border-[#302741]">
                                    {entry.type === 'PHONE_CALL' ? (
                                      <PhoneCall className="w-3.5 h-3.5 text-[#22D3EE]" />
                                    ) : entry.type === 'SMS_SENT' ? (
                                      <MessageSquare className="w-3.5 h-3.5 text-[#A855F7]" />
                                    ) : entry.type === 'WHATSAPP' ? (
                                      <Smartphone className="w-3.5 h-3.5 text-[#34D399]" />
                                    ) : entry.type === 'EMAIL_DISPATCH' ? (
                                      <Mail className="w-3.5 h-3.5 text-[#FBBF24]" />
                                    ) : (
                                      <MapPin className="w-3.5 h-3.5 text-[#EC4899]" />
                                    )}
                                  </span>

                                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    {entry.type.replace('_', ' ')}
                                  </span>

                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${outcomeBadgeClass}`}>
                                    {entry.outcome.replace('_', ' ')}
                                  </span>

                                  {entry.duration && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#100D1B] border border-[#302741] text-[#C9C4D6]">
                                      {entry.duration}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-[#C9C4D6]">
                                  <span>by <strong className="text-white">{entry.adminName}</strong></span>
                                  <span>·</span>
                                  <span className="font-mono">{formatBangladeshDateTime(entry.timestamp)}</span>
                                </div>
                              </div>

                              <p className="text-xs text-[#C9C4D6] bg-[#100D1B] p-3 rounded-xl border border-[#302741] leading-relaxed">
                                {entry.notes}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: COMPLIANCE AUDIT TRAIL */}
                {slideOverTab === 'AUDIT' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">Application Decision Ledger</h3>
                        <p className="text-xs text-[#C9C4D6]">
                          Immutable chronological audit log of all registration clearances, reviews, and decisions.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(!slideOverItem.auditTrail || slideOverItem.auditTrail.length === 0) ? (
                        <div className="p-4 rounded-xl bg-[#171226] border border-[#302741] text-xs text-[#C9C4D6] text-center">
                          Application submitted on {formatBangladeshDateTime(slideOverItem.registrationDate)}.
                        </div>
                      ) : (
                        slideOverItem.auditTrail.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-4 rounded-2xl bg-[#171226] border border-[#302741] space-y-2 text-xs"
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

                            <div className="text-white font-medium flex items-center justify-between text-xs">
                              <span>Actor: <strong className="text-[#A855F7]">{entry.actorName}</strong></span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30 font-mono">
                                Role: {entry.actorRole}
                              </span>
                            </div>

                            {entry.notes && (
                              <p className="text-[11px] text-[#C9C4D6] bg-[#100D1B] p-2.5 rounded-xl border border-[#302741] leading-relaxed">
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

              {/* Slide-over Footer Bar */}
              <div className="p-4 sm:p-5 border-t border-[#302741] bg-[#171226] flex items-center justify-between gap-3">
                <div className="text-xs text-[#C9C4D6]">
                  Status: <strong className="text-white">{slideOverItem.status}</strong>
                  {slideOverItem.reviewedBy && (
                    <span className="ml-1 text-[11px] text-[#C9C4D6]/70">(Reviewed by {slideOverItem.reviewedBy})</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSlideOverItem(null);
                      setIsAddingContact(false);
                    }}
                    className="px-4 py-2 bg-[#100D1B] hover:bg-[#251E3A] border border-[#302741] text-xs font-semibold text-white rounded-xl transition-colors"
                  >
                    Close
                  </button>

                  {slideOverItem.status !== 'APPROVED' && (
                    <button
                      onClick={() => {
                        setApprovingItem(slideOverItem);
                        setApprovalNote('');
                      }}
                      className="px-4 py-2 bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Registration</span>
                    </button>
                  )}

                  {slideOverItem.status !== 'REJECTED' && (
                    <button
                      onClick={() => {
                        setRejectingItem(slideOverItem);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 bg-[#F87171]/20 hover:bg-[#F87171]/30 text-[#F87171] border border-[#F87171]/40 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Application</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
