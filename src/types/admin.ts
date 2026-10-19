import type { UserRole } from './platform.ts';

export interface AdminPermissions {
  canApprovePayment: boolean;
  canAdjustBalance: boolean;
  canApproveUser: boolean;
  canCreateUser: boolean;
  canChangeOrderStatus: boolean;
  canSendSms: boolean;
  canViewFinancialReports: boolean;
  canAccessMessaging: boolean;
  canManageStaff: boolean;
}

export interface UserAccountBalance {
  userId: string;
  userName: string;
  mobile: string;
  accountType: 'RESELLER' | 'SUPPLIER';
  availableBalance: number;
  pendingBalance: number;
  accountStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  district: string;
  upazila: string;
  lastTransactionDate: string;
}

export interface BalanceAdjustmentRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: 'RESELLER' | 'SUPPLIER';
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  adminId: string;
  adminName: string;
  date: string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface TransactionIdApprovalItem {
  id: string;
  userId: string;
  userName: string;
  userRole: 'RESELLER' | 'SUPPLIER';
  userMobile: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank Transfer';
  transactionId: string;
  amount: number;
  senderInfo: string;
  paymentProof: string;
  requestDate: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  isDuplicate?: boolean;
}

export interface ResellerPayoutItem {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerMobile: string;
  availableProfitBalance: number;
  requestedAmount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank Transfer';
  accountNumber: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ON_HOLD';
  rejectionReason?: string;
  processedAt?: string;
  processedBy?: string;
}

export interface SupplierSettlementItem {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierMobile: string;
  totalDeliveredOrders: number;
  payableAmount: number;
  paymentMethod: string;
  accountDetails: string;
  settlementStatus: 'PENDING' | 'SETTLED' | 'HELD';
  requestDate: string;
  settledAt?: string;
  settledBy?: string;
}

export interface UserVerificationAuditEntry {
  id: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'UNDER_REVIEW' | string;
  previousStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'UNDER_REVIEW' | 'SUBMITTED' | string;
  newStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'UNDER_REVIEW' | string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  notes?: string;
  ipAddress?: string;
}

export interface ContactHistoryEntry {
  id: string;
  type: 'PHONE_CALL' | 'SMS_SENT' | 'EMAIL_DISPATCH' | 'WHATSAPP' | 'IN_PERSON_VISIT';
  timestamp: string;
  adminName: string;
  adminRole?: string;
  outcome: 'REACHED_VERIFIED' | 'CALL_BUSY' | 'UNREACHABLE' | 'FOLLOWUP_SCHEDULED' | 'EMAIL_DELIVERED' | 'DOCUMENT_REQUESTED';
  notes: string;
  duration?: string;
}

export interface UserVerificationItem {
  id: string;
  fullName: string;
  businessName: string;
  role: 'RESELLER' | 'SUPPLIER' | 'MODERATOR';
  mobile: string;
  email: string;
  district: string;
  upazila: string;
  address?: string;
  tradeLicense?: string;
  tin?: string;
  productCategory?: string;
  nidNumber?: string;
  verificationDocs: Array<{
    name: string;
    url: string;
    type: string;
    verified?: boolean;
    uploadDate?: string;
    fileSize?: string;
  }>;
  registrationDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'UNDER_REVIEW';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  auditTrail?: UserVerificationAuditEntry[];
  contactHistory?: ContactHistoryEntry[];
  ipAddress?: string;
  deviceInfo?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName?: string;
    routingNumber?: string;
  };
  socialLinks?: {
    facebook?: string;
    website?: string;
    storePage?: string;
  };
  applicantBio?: string;
}

export interface AdminFinancialMetrics {
  totalIncome: number;
  totalExpense: number;
  totalRecharge: number;
  totalWithdrawal: number;
  pendingPayout: number;
  approvedPayout: number;
  reserveFund: number;
  chartData: Array<{ label: string; credit: number; debit: number; net: number }>;
}

export interface AdminSmsMetrics {
  smsBalance: number;
  totalSent: number;
  todaySent: number;
  failed: number;
  deliverySuccessRate: number;
  automatedTriggers: Record<string, boolean>;
}

export type AdminViewModule =
  | 'dashboard'
  | 'accounts'
  | 'finances'
  | 'user-approvals'
  | 'create-user'
  | 'order-tracking'
  | 'sms-centre'
  | 'analytics'
  | 'reports'
  | 'mailbox'
  | 'permissions';
